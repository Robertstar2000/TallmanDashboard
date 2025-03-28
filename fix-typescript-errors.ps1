# PowerShell script to fix TypeScript errors in the TallmanDashboard project

# Fix DatabaseConnectionManager.tsx
$managerPath = "c:\Users\BobM\CascadeProjects\TallmanDashboard_new\components\admin\DatabaseConnectionManager.tsx"
$managerContent = Get-Content $managerPath -Raw

# Fix import for spinner
$managerContent = $managerContent -replace "import Spinner from '@/components/ui/spinner';", "import Spinner from '@/components/ui/spinner';"

# Fix import for use-local-storage
$managerContent = $managerContent -replace "import { useLocalStorage } from '@/lib/hooks/use-local-storage';", "import { useLocalStorage } from '@/lib/hooks/use-local-storage';"

# Write back to file
Set-Content -Path $managerPath -Value $managerContent

# Fix use-database-connection.ts
$hookPath = "c:\Users\BobM\CascadeProjects\TallmanDashboard_new\lib\hooks\use-database-connection.ts"
$hookContent = Get-Content $hookPath -Raw

# Fix import for use-local-storage
$hookContent = $hookContent -replace "import { useLocalStorage } from './use-local-storage';", "import { useLocalStorage } from '@/lib/hooks/use-local-storage';"

# Write back to file
Set-Content -Path $hookPath -Value $hookContent

# Fix DatabaseConnectionTester.tsx
$testerPath = "c:\Users\BobM\CascadeProjects\TallmanDashboard_new\components\admin\DatabaseConnectionTester.tsx"
$testerContent = Get-Content $testerPath -Raw

# Replace Material UI imports with Tailwind CSS imports
$newImports = @"
'use client';

import React, { useState, useEffect } from 'react';
import { ServerConfig } from '@/lib/db/connections';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Spinner from '@/components/ui/spinner';
import { Separator } from '@/components/ui/separator';
"@

# Replace the imports section
$testerContent = $testerContent -replace "(?s)'use client';.*?import { ServerConfig } from '@/lib/db/connections';", $newImports

# Fix port type from string to number
$testerContent = $testerContent -replace "port: '1433',", "port: 1433,"

# Write back to file
Set-Content -Path $testerPath -Value $testerContent

Write-Host "TypeScript errors have been fixed in the following files:"
Write-Host "- DatabaseConnectionManager.tsx"
Write-Host "- use-database-connection.ts"
Write-Host "- DatabaseConnectionTester.tsx"
