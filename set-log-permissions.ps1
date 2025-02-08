if (-not (Test-Path "C:\inetpub\wwwroot\TallmanDashboard\iisnode_logs")) {
    New-Item -ItemType Directory -Force -Path "C:\inetpub\wwwroot\TallmanDashboard\iisnode_logs"
}
$acl = Get-Acl "C:\inetpub\wwwroot\TallmanDashboard\iisnode_logs"
$rule = New-Object System.Security.AccessControl.FileSystemAccessRule("IIS AppPool\DefaultAppPool", "FullControl", "ContainerInherit,ObjectInherit", "None", "Allow")
$acl.SetAccessRule($rule)
Set-Acl "C:\inetpub\wwwroot\TallmanDashboard\iisnode_logs" $acl
