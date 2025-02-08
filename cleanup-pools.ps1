Import-Module WebAdministration

# Stop and remove any existing application pools with TallmanDashboard in the name
Get-IISAppPool | Where-Object { $_.Name -like '*TallmanDashboard*' } | ForEach-Object {
    Write-Host "Removing application pool: $($_.Name)"
    Stop-WebAppPool -Name $_.Name
    Remove-WebAppPool -Name $_.Name
}

# Create a fresh application pool
$poolName = "TallmanDashboardPool"
Write-Host "Creating new application pool: $poolName"
New-WebAppPool -Name $poolName
Set-ItemProperty IIS:\AppPools\$poolName -name processModel.identityType -value LocalSystem

# Get the site name from the current IIS binding
$siteName = "TallmanDashboard"

# Update the site to use the new application pool
Set-ItemProperty IIS:\Sites\$siteName -name applicationPool -value $poolName

Write-Host "Application pool cleanup complete. New pool '$poolName' created and set to LocalSystem."
