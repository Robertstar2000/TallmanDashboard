# Requires Administrator Privileges
$nodePath = "C:\Program Files\nodejs\node.exe"
$handlerName = "NodeHandler"
$handlerPath = "simple-server.js"

# Import WebAdministration Module
Import-Module WebAdministration

# Create a new handler mapping
New-WebHandler -Name $handlerName -Path $handlerPath -Verb "*" -Modules "isapi" -ScriptProcessor $nodePath -PSPath "IIS:\"

# Configure URL Rewrite
Add-WebConfigurationProperty -PSPath "IIS:\" -Filter "system.webServer/rewrite/rules" -Name "." -Value @{
    name = "NodeJS Application";
    stopProcessing = "True";
    match = @{
        url = "(.*)";
        negate = "False"
    };
    action = @{
        type = "Rewrite";
        url = $handlerPath
    }
}

Write-Host "Node.js IIS Handler configured successfully!"
