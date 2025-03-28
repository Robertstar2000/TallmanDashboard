# Microsoft Access Database Setup Guide

## Prerequisites for MS Access Database Connectivity

To connect to Microsoft Access databases from the Tallman Dashboard, you need to install the Microsoft Access Database Engine. This guide will walk you through the installation process.

## Installation Steps

### 1. Download Microsoft Access Database Engine 2016 Redistributable

Download the appropriate version of the Microsoft Access Database Engine 2016 Redistributable:

- [Download 32-bit version](https://www.microsoft.com/en-us/download/details.aspx?id=54920)
- [Download 64-bit version](https://www.microsoft.com/en-us/download/details.aspx?id=54920)

**Note:** You may need to install both versions depending on your system configuration. If you have Microsoft Office installed, make sure to download the version (32-bit or 64-bit) that matches your Office installation.

### 2. Install the Database Engine

1. Run the downloaded installer (`AccessDatabaseEngine.exe` or `AccessDatabaseEngine_X64.exe`)
2. Follow the installation prompts
3. Restart your computer after installation

### 3. Verify Installation

To verify that the Microsoft Access Database Engine is properly installed:

1. Open PowerShell as Administrator
2. Run the following command:

```powershell
$conn = New-Object -ComObject ADODB.Connection
if ($conn) { Write-Host "ADODB Connection object created successfully" } else { Write-Host "Failed to create ADODB Connection object" }
```

If the command outputs "ADODB Connection object created successfully", the installation was successful.

## Troubleshooting

### Common Issues

1. **"Provider cannot be found" Error**
   - This indicates that the Microsoft Access Database Engine is not installed or not registered properly
   - Solution: Reinstall the Microsoft Access Database Engine and restart your computer

2. **Bitness Mismatch**
   - If you have 32-bit Office but try to use 64-bit components (or vice versa)
   - Solution: Install the version that matches your Office installation

3. **Permission Issues**
   - Ensure the user running the application has read/write permissions to the MS Access file
   - Solution: Check file permissions and adjust if necessary

4. **COM Registration Issues**
   - The COM components might not be registered properly
   - Solution: Run the following command as Administrator:
     ```
     regsvr32 "C:\Program Files\Common Files\Microsoft Shared\OFFICE16\ACEDAO.DLL"
     ```

## Additional Resources

- [Microsoft Access Database Engine 2016 Redistributable](https://www.microsoft.com/en-us/download/details.aspx?id=54920)
- [Microsoft Access OLEDB Provider Documentation](https://docs.microsoft.com/en-us/sql/ado/guide/appendixes/microsoft-ole-db-provider-for-microsoft-jet)
