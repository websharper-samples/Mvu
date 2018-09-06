param (
    [parameter(mandatory=$true,
               helpMessage="example: GetItDone")]
    [string]
    $sampleName,

    [parameter(mandatory=$true,
               helpMessage="example: MaterialUI (leave empty for same as sampleName)")]
    [allowEmptyString()]
    [string]
    $extensionName,

    [parameter(mandatory=$true,
               helpMessage="example: React <ENTER> MaterialUI <ENTER> <ENTER>")]
    [allowEmptyCollection()]
    [string[]]
    $packages,

    [parameter(mandatory=$true,
               helpMessage="example: https://material-ui.com/ (leave empty for none)")]
    [allowEmptyString()]
    [string]
    $libUrl
)

if ($extensionName -eq '') {
    $extensionName = $sampleName
}

function sed {
    param([string] $file, [string] $in, [string] $out)
    (get-content $file) -replace $in, $out | set-content $file
}

$repo = "https://github.com/websharper-samples/$sampleName"
$updateText = ''
$packageText = ''
$packages | foreach {
    $ext = $_
    if (-not $ext.startsWith("WebSharper.")) {
        $ext = "WebSharper." + $ext
    }
    $updateText += "    dotnet add src package $ext`r`n"
    $packageText += "    <PackageReference Include=`"$ext`" Version=`"0.0`" />`r`n"
}
sed build.ps1 "@dotnet-update@" $updateText
sed src/Project.fsproj "@packages@" $packageText
sed src/wwwroot/index.html "@sampleName@" $sampleName
sed tools/gh-pages.ps1 "@repo@" $repo
if ($libUrl -eq '') {
    $libLink = $sampleName
} else {
    $libLink = "[$extensionName]($libUrl)"
}
sed README.md "@libLink@" $libLink
sed README.md "@sampleName@" $sampleName
sed README.md "@repoUrl@" $repo
sed README.md "@liveUrl@" "https://websharper-samples.github.io/$sampleName"

write-host @"
You can now:
- Copy source file to src/Client.fs.
    - Turn its Main value into a [<SPAEntryPoint>] Main() function
- If markup has anything special, copy it to src/wwwroot/index.html
    - Replace its <!--[BODY]--> with:
        <script src="Content/$sampleName.js"></script>
    - Add to its head:
        <link rel="stylesheet" href="Content/$sampleName.css" />
        <script src="Content/$sampleName.head.js"></script>
"@ -f green

read-host "When done, press enter to test compile and run"

mv src/Project.fsproj src/$sampleName.fsproj
rm init.ps1
.\build.ps1 -update
if ($lastexitcode -ne 0) {
    write-host @"
It seems the build failed. revert everything by running the following:
    git reset --hard HEAD^
"@ -f red
    exit 1
}

write-host @"
Now running the app so you can test it.
"@ -f green
start-process dotnet $("run", "-p", "src")
read-host "When done, press enter to commit all"
git add .
git commit -m "Initial commit for $sampleName"
git fetch origin gh-pages:gh-pages
git remote set-url origin $repo
write-host @"
Committed and set remote to $repo.
You can now push:
    git push origin master; git push origin gh-pages
"@ -f green
