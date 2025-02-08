Import-Module WebAdministration
Set-ItemProperty IIS:\AppPools\TallmanDashboardPool -name processModel.identityType -value LocalSystem
Restart-WebAppPool -Name TallmanDashboardPool
