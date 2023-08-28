$continueLoop = $true

try {
    $nodeVersion = node -v
    $versionParts = $nodeVersion.Split(".")
    $majorVersion = [int]$versionParts[0].TrimStart("v")
    if ($majorVersion -lt 16) {
        Write-Host "Node.js sürümü 16'dan küçüktür."
        exit
    } 
    npm -v
    Clear-Host
}
catch {
    Write-Host "Hata Oluştu: $($_.Exception.Message)"
    exit
}
$moduleName = "pm2"
$command = "npm ls -g $moduleName"
$result = Invoke-Expression $command

if ($result -match "$moduleName@") {
    Write-Host "$moduleName modülü yüklüdür."
} else {
    Write-Host "$moduleName modülü yüklü değildir. Yükleniyor..."
    Invoke-Expression "npm install -g $moduleName"
    Write-Host "$moduleName modülü yüklendi."
}



while ($continueLoop) {
    Clear-Host
    Write-Host "1. Projeyi başlat (açılış için)" -ForegroundColor Green
    Write-Host "2. Projeyi yeniden başlat" -ForegroundColor Green
    Write-Host "3. Projeyi kapat" -ForegroundColor Green
    Write-Host "4. Proje durumu" -ForegroundColor Green
    Write-Host "5. Log" -ForegroundColor Green
    Write-Host "6. Kapat" -ForegroundColor Green
    Write-Host
    Write-Host "Seçiminizi girin" -ForegroundColor Yellow
    $choice = Read-Host ":"

    switch ($choice) {
        "1" {
            try {  
                Write-Host "Başlatılacak dosya (index.js)" -ForegroundColor Blue
                $path = Read-Host ":"
                if ($path -eq "") {
                    $path = "index.js"
                }
                pm2 start $path --exp-backoff-restart-delay=100 
            } catch {
                Write-Host "Hata Oluştu: $($_.Exception.Message)"
            }
            Write-Host "Devam etmek için Enter tuşuna basın..."
            $null = [System.Console]::In.ReadLine()
        }
        "2" {
            try {  
                pm2 restart all
            } catch {
                Write-Host "Hata Oluştu: $($_.Exception.Message)"
            }
            Write-Host "Devam etmek için Enter tuşuna basın..."
            $null = [System.Console]::In.ReadLine()
        }
        "3" {
            try {  
                pm2 stop all
            } catch {
                Write-Host "Hata Oluştu: $($_.Exception.Message)"
            }
            Write-Host "Devam etmek için Enter tuşuna basın..."
            $null = [System.Console]::In.ReadLine()
        }
        "4" {
            Write-Host "1) status" -ForegroundColor Blue
            Write-Host "2) monit" -ForegroundColor Blue
            $path = Read-Host ":"
            try {  
                switch ($path) {
                    "1" {
                        pm2 status
                    }
                    "2" {
                        pm2 monit
                    }
                    Default {
                        pm2 log
                    }
                }
            } catch {
                Write-Host "Hata Oluştu: $($_.Exception.Message)"
            }
            Write-Host "Devam etmek için Enter tuşuna basın..."
            $null = [System.Console]::In.ReadLine()
        }
        "5" {
            try {  
                pm2 log
            } catch {
                Write-Host "Hata Oluştu: $($_.Exception.Message)"
            }
            Write-Host "Devam etmek için Enter tuşuna basın..."
            $null = [System.Console]::In.ReadLine()
        }
        "6" {
            $continueLoop = $false
        }
        default {
            Write-Host "Geçersiz seçenek."
            Write-Host "Devam etmek için Enter tuşuna basın..."
            $null = [System.Console]::In.ReadLine()
        }
    }
}
