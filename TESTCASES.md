# API Test Cases

---

## 1. System Health Check

**Purpose:** Verify backend server is live after deployment.

**Endpoint:** `GET /health`

### Command
```powershell
Invoke-RestMethod "https://modex-clinic-booking-system.onrender.com/health"
```

### Expected Response
```json
{
  "status": "ok"
}
```

---

## 2. Fetch All Public Slots

**Purpose:** Ensure public slot listing API is working.

**Endpoint:** `GET /api/slots`

### Command
```powershell
Invoke-RestMethod "https://modex-clinic-booking-system.onrender.com/api/slots" | ConvertTo-Json -Depth 4
```

### Expected Response
```json
{
  "slots": [
    {
      "id": "...",
      "doctorId": "...",
      "capacity": 5,
      "availableSeats": 4,
      "confirmedCount": 1
    }
  ]
}
```

---

## 3. Fetch All Doctors (Admin Route)

**Purpose:** Validate admin-protected API works using tokens.

**Endpoint:** `GET /api/admin/doctors`

### Command
```powershell
$hdr = @{ Authorization = "Bearer changeme" }
Invoke-RestMethod -Uri "https://modex-clinic-booking-system.onrender.com/api/admin/doctors" -Headers $hdr
```

### Expected Response
```json
{
  "doctors": [
    {
      "id": "...",
      "name": "Dr. Test",
      "specialization": "General"
    }
  ]
}
```

---

## 4. Create Doctor (Admin)

**Purpose:** Ensure new doctors can be added.

**Endpoint:** `POST /api/admin/doctors`

### Command
```powershell
$body = @{ name = "Dr. Recording"; specialization = "General" } | ConvertTo-Json
Invoke-RestMethod -Uri "https://modex-clinic-booking-system.onrender.com/api/admin/doctors" `
                  -Method POST `
                  -Headers @{ "Content-Type" = "application/json"; Authorization = "Bearer changeme" } `
                  -Body $body
```

### Expected Response
```json
{
  "doctor": {
    "id": "...",
    "name": "Dr. Recording",
    "specialization": "General"
  }
}
```

---

## 5. Create Slot (Admin)

**Purpose:** Ensure slots can be created for doctors.

**Endpoint:** `POST /api/admin/slots`

### Command
```powershell
$body = @{
  doctorId = "<DOCTOR_ID>";
  startTime = "2025-12-20T10:00:00Z";
  endTime = "2025-12-20T11:00:00Z";
  capacity = 5
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://modex-clinic-booking-system.onrender.com/api/admin/slots" `
                  -Method POST `
                  -Headers @{ "Content-Type" = "application/json"; Authorization = "Bearer changeme" } `
                  -Body $body
```

### Expected Response
```json
{
  "slot": {
    "id": "...",
    "capacity": 5
  }
}
```

---

## 6. Create Booking (Public)

**Purpose:** Verify users can book appointments.

**Endpoint:** `POST /api/bookings`

### Command
```powershell
$body = @{ slotId = "<SLOT_ID>"; userName = "TestUser" } | ConvertTo-Json
Invoke-RestMethod -Uri "https://modex-clinic-booking-system.onrender.com/api/bookings" `
                  -Method POST `
                  -Headers @{ "Content-Type" = "application/json" } `
                  -Body $body
```

### Expected Success Response
```json
{
  "booking": {
    "status": "CONFIRMED"
  }
}
```

### Expected Error Cases

**Slot Full:**
```json
{ "error": "Slot is full." }
```

**Slot Not Found:**
```json
{ "error": "Slot not found." }
```

---

## 7. Concurrency Booking Test ⚠️ (Very Important)

**Purpose:** Ensure race condition is prevented & only 1 booking succeeds when a slot becomes full.

### Command
```bash
curl -s -X POST -H "Content-Type: application/json" \
     -d '{"slotId":"<SLOT_ID>","userName":"A"}' \
     https://modex-clinic-booking-system.onrender.com/api/bookings &

curl -s -X POST -H "Content-Type: application/json" \
     -d '{"slotId":"<SLOT_ID>","userName":"B"}' \
     https://modex-clinic-booking-system.onrender.com/api/bookings
```

### Expected Behavior

| Request | Expected Result |
|---------|-----------------|
| One request | `201 CONFIRMED` ✔️ |
| Other | `409 Slot is Full` ✘ |

---

## 8. Update Slot Capacity (Admin)

**Purpose:** Verify admins can modify slot capacity.

**Endpoint:** `PATCH /api/admin/slots/:id`

### Command
```powershell
$payload = @{ capacity = 10 } | ConvertTo-Json
Invoke-RestMethod -Uri "https://modex-clinic-booking-system.onrender.com/api/admin/slots/<SLOT_ID>" `
                  -Method PATCH `
                  -Headers @{ "Content-Type" = "application/json"; Authorization = "Bearer changeme" } `
                  -Body $payload
```

### Expected Response
```json
{
  "slot": { "capacity": 10 }
}
```

---

## 9. Soft Delete Slot (Admin)

**Purpose:** Mark slots inactive while retaining data.

**Endpoint:** `PATCH /api/admin/slots/:id/soft-delete`

### Command
```powershell
Invoke-RestMethod -Uri "https://modex-clinic-booking-system.onrender.com/api/admin/slots/<SLOT_ID>/soft-delete" `
                  -Method PATCH `
                  -Headers @{ Authorization = "Bearer changeme" }
```

### Expected Response
```json
{ "message": "Slot soft-deleted." }
```

---

## 10. CORS Validation Test 🔒 (Critical for Deployment)

**Purpose:** Ensure backend CORS is configured to allow Vercel frontend.

### Command
Must use `curl.exe` on Windows:
```powershell
curl.exe -i -H "Origin: https://modex-clinic-booking-system.vercel.app" `
        https://modex-clinic-booking-system.onrender.com/api/slots
```

### Expected Response Headers
```
access-control-allow-origin: https://modex-clinic-booking-system.vercel.app
access-control-allow-credentials: true
```

---

## 11. Frontend → Backend Integration Test

**Purpose:** Ensure frontend successfully calls backend APIs.

### Steps

1. Open Browser DevTools → **Network** tab
2. Visit deployed frontend:
   - https://modex-clinic-booking-system.vercel.app

3. Trigger the following actions:
   - Fetch slots
   - Create bookings
   - Admin creates slot

### Verification Checklist

- [ ] Status codes: `200` or `201`
- [ ] JSON responses are correct
- [ ] CORS headers are present