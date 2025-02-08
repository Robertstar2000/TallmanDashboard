Import-Module WebAdministration
Set-ItemProperty IIS:\AppPools\TallmanDashboardPool -name processModel.identityType -value NetworkService
Restart-WebAppPool -Name TallmanDashboardPool
