# Check which process is using port 3000
$port = 3000
Write-Host "Checking for processes using port $port..."

# Get the process ID (PID) using port 3000
$processInfo = netstat -ano | Select-String ":$port\s+.*LISTENING" | ForEach-Object {
    ($_ -split '\s+')[-1] # Extract the PID (last column)
}

if ($processInfo) {
    Write-Host "Port $port is being used by the following process ID(s): $processInfo"

    # Terminate the process(es) using port 3000
    foreach ($processId in $processInfo) { # Use a different variable name
        try {
            Stop-Process -Id $processId -Force -ErrorAction Stop
            Write-Host "Successfully terminated process with PID $processId."
        } catch {
            Write-Host "Failed to terminate process with PID $processId. Error: $_"
        }
    }
} else {
    Write-Host "No process is using port $port."
}