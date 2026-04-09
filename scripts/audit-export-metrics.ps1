param(
  [string]$ZipPath = "import/all-time-export.zip"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.IO.Compression.FileSystem

function Open-ZipArchive {
  param(
    [string]$Path
  )

  if (-not (Test-Path -LiteralPath $Path)) {
    throw "ZIP not found: $Path"
  }

  return [System.IO.Compression.ZipFile]::OpenRead((Resolve-Path -LiteralPath $Path))
}

function Get-ZipEntry {
  param(
    [System.IO.Compression.ZipArchive]$Zip,
    [string]$EntryPath
  )

  return $Zip.Entries | Where-Object { $_.FullName -eq $EntryPath } | Select-Object -First 1
}

function Read-ZipJson {
  param(
    [System.IO.Compression.ZipArchive]$Zip,
    [string]$EntryPath
  )

  $entry = Get-ZipEntry -Zip $Zip -EntryPath $EntryPath
  if ($null -eq $entry) {
    throw "Missing ZIP entry: $EntryPath"
  }

  $reader = New-Object System.IO.StreamReader($entry.Open())
  try {
    return $reader.ReadToEnd() | ConvertFrom-Json
  }
  finally {
    $reader.Dispose()
  }
}

function Get-Entries {
  param(
    [object]$Data,
    [string]$Key
  )

  if ($Data -is [System.Array]) {
    return @($Data)
  }

  $property = $Data.PSObject.Properties[$Key]
  if ($null -ne $property -and $property.Value -is [System.Array]) {
    return @($property.Value)
  }

  return @()
}

function Get-LabelValueEntry {
  param(
    [object]$Entry,
    [string]$Label
  )

  foreach ($item in @($Entry.label_values)) {
    if ([string]$item.label -eq $Label) {
      return $item
    }
  }

  return $null
}

function Get-StringMapValue {
  param(
    [object]$Entry,
    [string]$Key
  )

  $stringMap = $Entry.string_map_data
  if ($null -eq $stringMap) {
    return ""
  }

  foreach ($property in $stringMap.PSObject.Properties) {
    if ($property.Name -eq $Key) {
      return [string]$property.Value.value
    }
  }

  foreach ($property in $stringMap.PSObject.Properties) {
    if ($property.Name.Trim().ToLowerInvariant() -eq $Key.Trim().ToLowerInvariant()) {
      return [string]$property.Value.value
    }
  }

  return ""
}

function Parse-InsightCount {
  param(
    [string]$Value
  )

  $digits = [string]$Value -replace "[^\d-]", ""
  if ([string]::IsNullOrWhiteSpace($digits)) {
    return $null
  }

  return [int]$digits
}

function Normalize-Username {
  param(
    [string]$Value
  )

  return $Value.Trim().TrimStart("@").ToLowerInvariant()
}

function Get-UsernameFromHref {
  param(
    [string]$Href
  )

  if ([string]::IsNullOrWhiteSpace($Href)) {
    return ""
  }

  $match = [regex]::Match($Href, "instagram\.com\/(?:_u\/)?([^\/?#]+)", "IgnoreCase")
  if ($match.Success) {
    return Normalize-Username -Value $match.Groups[1].Value
  }

  return ""
}

function Get-RelationshipUsername {
  param(
    [object]$Entry
  )

  $title = Normalize-Username -Value ([string]$Entry.title)
  if ($title) {
    return $title
  }

  $stringListData = @($Entry.string_list_data)
  if ($stringListData.Count -eq 0) {
    return ""
  }

  $first = $stringListData[0]
  $value = Normalize-Username -Value ([string]$first.value)
  if ($value) {
    return $value
  }

  return Get-UsernameFromHref -Href ([string]$first.href)
}

function Get-UniqueRelationshipUsernames {
  param(
    [object[]]$Entries
  )

  $seen = @{}
  $usernames = New-Object System.Collections.Generic.List[string]

  foreach ($entry in @($Entries)) {
    $username = Get-RelationshipUsername -Entry $entry
    if ([string]::IsNullOrWhiteSpace($username)) {
      continue
    }

    if (-not $seen.ContainsKey($username)) {
      $seen[$username] = $true
      [void]$usernames.Add($username)
    }
  }

  return $usernames
}

function Format-Number {
  param(
    [AllowNull()]
    [object]$Value
  )

  if ($null -eq $Value) {
    return "null"
  }

  return ([int64]$Value).ToString("N0")
}

$zip = Open-ZipArchive -Path $ZipPath

try {
  $reachData = Read-ZipJson -Zip $zip -EntryPath "logged_information/past_instagram_insights/profiles_reached.json"
  $interactionData = Read-ZipJson -Zip $zip -EntryPath "logged_information/past_instagram_insights/content_interactions.json"
  $audienceData = Read-ZipJson -Zip $zip -EntryPath "logged_information/past_instagram_insights/audience_insights.json"
  $followersData = Read-ZipJson -Zip $zip -EntryPath "connections/followers_and_following/followers_1.json"
  $followingData = Read-ZipJson -Zip $zip -EntryPath "connections/followers_and_following/following.json"
  $downloadRequests = Read-ZipJson -Zip $zip -EntryPath "your_instagram_activity/other_activity/your_information_download_requests.json"

  $reachEntry = @($reachData.organic_insights_reach)[0]
  $interactionEntry = @($interactionData.organic_insights_interactions)[0]
  $audienceEntry = @($audienceData.organic_insights_audience)[0]

  $followers = Get-UniqueRelationshipUsernames -Entries (Get-Entries -Data $followersData -Key "relationships_followers")
  $following = Get-UniqueRelationshipUsernames -Entries (Get-Entries -Data $followingData -Key "relationships_following")

  $followerSet = @{}
  foreach ($username in $followers) {
    $followerSet[$username] = $true
  }

  $mutualCount = 0
  $notFollowingBackCount = 0

  foreach ($username in $following) {
    if ($followerSet.ContainsKey($username)) {
      $mutualCount += 1
    }
    else {
      $notFollowingBackCount += 1
    }
  }

  $latestJsonRequest = @($downloadRequests) |
    Where-Object { [string](Get-LabelValueEntry -Entry $_ -Label "Output format").value -eq "JSON" } |
    Sort-Object timestamp -Descending |
    Select-Object -First 1

  Write-Output "ZIP: $ZipPath"
  Write-Output ""
  Write-Output "Overview Metrics"
  Write-Output ("- overview window: {0}" -f (Get-StringMapValue -Entry $reachEntry -Key "Date Range"))
  Write-Output ("- accounts reached: {0}" -f (Format-Number (Parse-InsightCount (Get-StringMapValue -Entry $reachEntry -Key "Accounts reached"))))
  Write-Output ("- profile visits: {0}" -f (Format-Number (Parse-InsightCount (Get-StringMapValue -Entry $reachEntry -Key "Profile visits"))))
  Write-Output ("- external link taps: {0}" -f (Format-Number (Parse-InsightCount (Get-StringMapValue -Entry $reachEntry -Key "External link taps"))))
  Write-Output ("- content interactions: {0}" -f (Format-Number (Parse-InsightCount (Get-StringMapValue -Entry $interactionEntry -Key "Content interactions"))))
  Write-Output ("- accounts engaged: {0}" -f (Format-Number (Parse-InsightCount (Get-StringMapValue -Entry $interactionEntry -Key "Accounts engaged"))))
  Write-Output ("- impressions: {0}" -f (Format-Number (Parse-InsightCount (Get-StringMapValue -Entry $reachEntry -Key "Impressions"))))
  Write-Output ""
  Write-Output "Relationship Signals"
  Write-Output ("- followers: {0}" -f (Format-Number $followers.Count))
  Write-Output ("- following: {0}" -f (Format-Number $following.Count))
  Write-Output ("- mutuals: {0}" -f (Format-Number $mutualCount))
  Write-Output ("- not following back: {0}" -f (Format-Number $notFollowingBackCount))
  Write-Output ""
  Write-Output "Reference Notes"
  Write-Output ("- audience insights followers: {0}" -f (Format-Number (Parse-InsightCount (Get-StringMapValue -Entry $audienceEntry -Key "Followers"))))
  Write-Output ("- follows in range: {0}" -f (Format-Number (Parse-InsightCount (Get-StringMapValue -Entry $audienceEntry -Key "Follows"))))
  Write-Output ("- unfollows in range: {0}" -f (Format-Number (Parse-InsightCount (Get-StringMapValue -Entry $audienceEntry -Key "Unfollows"))))
  Write-Output ("- net followers in range: {0}" -f (Format-Number (Parse-InsightCount (Get-StringMapValue -Entry $audienceEntry -Key "Overall followers"))))
  Write-Output ("- export start timestamp: {0}" -f (Get-LabelValueEntry -Entry $latestJsonRequest -Label "Start date").timestamp_value)
  Write-Output ("- export end timestamp: {0}" -f (Get-LabelValueEntry -Entry $latestJsonRequest -Label "End date").timestamp_value)
  Write-Output ("- export format: {0}" -f (Get-LabelValueEntry -Entry $latestJsonRequest -Label "Output format").value)
  Write-Output ("- media quality: {0}" -f (Get-LabelValueEntry -Entry $latestJsonRequest -Label "Media quality").value)
}
finally {
  $zip.Dispose()
}
