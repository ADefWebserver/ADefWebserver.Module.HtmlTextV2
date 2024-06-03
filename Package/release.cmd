del "*.nupkg"
"..\..\oqtane.framework\oqtane.package\nuget.exe" pack ADefWebserver.Module.HtmlTextV2.nuspec 
XCOPY "*.nupkg" "..\..\oqtane.framework\Oqtane.Server\Packages\" /Y

