param (
    [switch] $update,
    [switch] $useDaily,
    [switch] $commit
)

if ($update) {

    if ($useDaily) {
        $from = '<add key="daily.websharper.com" value="true" />'
        $to = '<add key="daily.websharper.com" value="false" />'
        (get-content NuGet.config) -replace $from, $to | set-content NuGet.config
    }

    dotnet add src package WebSharper
    dotnet add src package WebSharper.FSharp
@dotnet-update@}

dotnet build src
