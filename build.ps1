param (
    [switch] $update,
    [switch] $useDaily,
    [switch] $commitPackageUpdate
)

if ($useDaily) {
    $from = '<add key="daily.websharper.com" value="true" />'
    $to = '<add key="daily.websharper.com" value="false" />'
    (get-content NuGet.config) -replace $from, $to | set-content NuGet.config
}

if ($update) {

    dotnet add src package WebSharper
    dotnet add src package WebSharper.FSharp
    dotnet add src package WebSharper.Mvu
    dotnet add src package WebSharper.UI
}

dotnet build src
if ($lastexitcode -ne 0) { exit $lastexitcode }

if ($commitPackageUpdate) {
    git add src/*.*proj
    git commit -m 'Update packages'
    git push origin master
}
