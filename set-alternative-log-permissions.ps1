if (-not (Test-Path "C:\Users\BobM\CascadeProjects\TallmanDashboard\logs\iisnode")) {
    New-Item -ItemType Directory -Force -Path "C:\Users\BobM\CascadeProjects\TallmanDashboard\logs\iisnode"
}

$acl = Get-Acl "C:\Users\BobM\CascadeProjects\TallmanDashboard\logs\iisnode"
$rule = New-Object System.Security.AccessControl.FileSystemAccessRule("NT AUTHORITY\SYSTEM", "FullControl", "ContainerInherit,ObjectInherit", "None", "Allow")
$acl.SetAccessRule($rule)
Set-Acl "C:\Users\BobM\CascadeProjects\TallmanDashboard\logs\iisnode" $acl
