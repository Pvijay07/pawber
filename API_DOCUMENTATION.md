# 🐾 Pawber (Pawber) — API Documentation

> **Base URL (Production):** `https://pawber.onrender.com`  
> **API Version:** v1  
> **All API routes are prefixed with:** `/api`

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [Bookings](#2-bookings)
3. [Services](#3-services)
4. [Pets](#4-pets)
5. [Wallet](#5-wallet)
6. [Events](#6-events)
7. [Notifications](#7-notifications)
8. [Reviews](#8-reviews)
9. [Providers](#9-providers)
10. [Slots](#10-slots)
11. [Payments](#11-payments)
12. [Chat](#12-chat)
13. [Tracking](#13-tracking)
14. [Admin](#14-admin)
15. [Webhooks](#15-webhooks)
16. [Debug](#16-debug)
17. [Health Check](#17-health-check)
18. [Error Handling](#18-error-handling)

---

## Common Headers

| Header          | Value                    | Description                         |
|-----------------|--------------------------|-------------------------------------|
| `Content-Type`  | `application/json`       | Required for all POST/PATCH/PUT     |
| `Authorization` | `Bearer <access_token>`  | Required for 🔒 protected endpoints |

## Response Format

All responses follow a consistent envelope:

```json
// Success (module routes)
{ "success": true, "data": { ... } }

// Success (legacy routes)
{ "key": { ... } }

// Error
{ "success": false, "error": { "message": "..." } }
// or
{ "error": "..." }
```

---

## 1. Authentication

### `POST /api/auth/signup`

🔓 **Public** — Create a new account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "min6chars",
  "full_name": "John Doe",
  "phone": "+919876543210",       // optional
  "role": "client"                // "client" | "provider", default: "client"
}
```

**Success Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "message": "Account created successfully",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "client",
      "full_name": "John Doe"
    },
    "session": {
      "access_token": "jwt...",
      "refresh_token": "refresh...",
      "expires_at": 1700000000
    }
  }
}
```

**Errors:**
| Status | Message |
|--------|---------|
| 400 | Invalid email / password too short / duplicate email |
| 500 | Failed to create profile |

---

### `POST /api/auth/signin`

🔓 **Public** — Sign in with email & password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Success Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "client",
      "full_name": "John Doe",
      "avatar_url": null
    },
    "session": {
      "access_token": "jwt...",
      "refresh_token": "refresh...",
      "expires_at": 1700000000
    }
  }
}
```

**Errors:**
| Status | Message |
|--------|---------|
| 401 | Invalid email or password |

---

### `POST /api/auth/refresh`

🔓 **Public** — Refresh an expired access token.

**Request Body:**
```json
{
  "refresh_token": "your_refresh_token"
}
```

**Success Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "session": {
      "access_token": "new_jwt...",
      "refresh_token": "new_refresh...",
      "expires_at": 1700000000
    }
  }
}
```

**Errors:**
| Status | Message |
|--------|---------|
| 400 | refresh_token is required |
| 401 | Invalid refresh token |

---

### `GET /api/auth/me`

🔒 **Protected** — Get current user's profile.

**Success Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "role": "client",
      "full_name": "John Doe",
      "phone": "+919876543210",
      "avatar_url": null,
      "created_at": "2026-01-01T00:00:00Z"
    }
  }
}
```

---

### `PATCH /api/auth/me`

🔒 **Protected** — Update current user's profile.

**Request Body:** (all fields optional)
```json
{
  "full_name": "Jane Doe",
  "phone": "+919876543210",
  "avatar_url": "https://example.com/avatar.jpg"
}
```

**Success Response:** `200 OK`
```json
{
  "success": true,
  "data": { "user": { ... } }
}
```

---

### `POST /api/auth/signout`

🔒 **Protected** — Sign out the current session.

**Success Response:** `200 OK`
```json
{
  "success": true,
  "data": { "message": "Signed out successfully" }
}
```

---

## 2. Bookings

> All booking endpoints require authentication (`Bearer` token).

### `POST /api/bookings`

🔒 **Protected** — Create a new booking.

**Request Body:**
```json
{
  "service_id": "uuid",
  "package_id": "uuid",
  "booking_type": "instant",        // "instant" | "scheduled"
  "booking_date": "2026-04-01",     // ISO date, required for scheduled
  "slot_id": "uuid",                // optional, for scheduled bookings
  "pet_ids": ["uuid1", "uuid2"],    // min 1 required
  "addon_ids": ["uuid1"],           // optional, default: []
  "address": "123 Pet Lane",        // optional
  "latitude": 12.9716,              // optional
  "longitude": 77.5946,             // optional
  "notes": "Be gentle with Max",    // optional
  "coupon_code": "FLAT20"           // optional
}
```

**Success Response:** `201 Created`
```json
{
  "booking": {
    "id": "uuid",
    "user_id": "uuid",
    "service_id": "uuid",
    "package_id": "uuid",
    "booking_type": "instant",
    "booking_date": "2026-04-01",
    "total_amount": 1150.00,
    "status": "confirmed",
    "pet_ids": ["uuid1"],
    "addon_ids": ["uuid1"],
    "coupon_discount": 0,
    "created_at": "2026-03-29T00:00:00Z"
  }
}
```

**Business Rules:**
- Instant bookings get a 15% surcharge
- Total = `package_price × pet_count + addon_prices × pet_count`
- Scheduled bookings lock the slot for 5 minutes
- Coupon validation includes date range, usage limit, and min order checks

**Errors:**
| Status | Message |
|--------|---------|
| 404 | Package not found |
| 400 | Instant/Scheduled booking not available for this package |
| 409 | Selected slot is no longer available |

---

### `GET /api/bookings`

🔒 **Protected** — List current user's bookings.

**Query Parameters:**
| Param  | Type   | Default | Description                            |
|--------|--------|---------|----------------------------------------|
| status | string | —       | Filter: pending, confirmed, completed… |
| limit  | number | 20      | Max results                            |
| offset | number | 0       | Pagination offset                      |

**Success Response:** `200 OK`
```json
{
  "bookings": [
    {
      "id": "uuid",
      "status": "confirmed",
      "total_amount": 500,
      "service": { "name": "Dog Grooming", "description": "..." },
      "package": { "package_name": "Premium", "price": 500, "duration_minutes": 60 },
      "provider": { "business_name": "Happy Paws", "rating": 4.5 },
      "booking_pets": [{ "pet": { "id": "uuid", "name": "Max", "image_url": "..." } }],
      "booking_addons": [{ "addon": { "id": "uuid", "name": "Nail Trim" }, "price": 100 }]
    }
  ]
}
```

---

### `GET /api/bookings/:id`

🔒 **Protected** — Get detailed booking information.

**Success Response:** `200 OK`
```json
{
  "booking": {
    "id": "uuid",
    "status": "confirmed",
    "service": { "name": "...", "description": "...", "image_url": "..." },
    "package": { "package_name": "...", "price": 500, "duration_minutes": 60, "features": [...] },
    "provider": {
      "business_name": "...",
      "rating": 4.5,
      "address": "...",
      "user": { "full_name": "...", "phone": "...", "avatar_url": "..." }
    },
    "booking_pets": [{ "pet": { "id": "uuid", "name": "Max", "type": "dog", "breed": "Labrador" } }],
    "booking_addons": [{ "addon": { "id": "uuid", "name": "Nail Trim" }, "price": 100 }]
  }
}
```

---

### `POST /api/bookings/:id/cancel`

🔒 **Protected** — Cancel a booking.

**Request Body:**
```json
{
  "reason": "Changed my plans"    // optional
}
```

**Business Rules:**
- Only `pending` or `confirmed` bookings can be cancelled
- Releases locked slot if scheduled
- Auto-refunds to wallet if payment was made

**Success Response:** `200 OK`
```json
{
  "booking": { ... },
  "message": "Booking cancelled successfully"
}
```

---

### `PATCH /api/bookings/:id/status`

🔒 **Protected** — Provider/Admin: Update booking status.

**Required Roles:** `provider` or `admin`

**Request Body:**
```json
{
  "status": "in_progress"    // "confirmed" | "in_progress" | "completed"
}
```

**Success Response:** `200 OK`
```json
{
  "booking": { "id": "uuid", "status": "in_progress", ... }
}
```

---

## 3. Services

### `GET /api/services/categories`

🔓 **Public** — List all active service categories.

**Success Response:** `200 OK`
```json
{
  "categories": [
    {
      "id": "uuid",
      "name": "Grooming",
      "icon_url": "https://...",
      "is_active": true,
      "sort_order": 1
    }
  ]
}
```

---

### `GET /api/services`

🔓 **Public** — List all active services.

**Query Parameters:**
| Param       | Type   | Description              |
|-------------|--------|--------------------------|
| category_id | string | Filter by category UUID  |

**Success Response:** `200 OK`
```json
{
  "services": [
    {
      "id": "uuid",
      "name": "Dog Grooming",
      "description": "...",
      "is_active": true,
      "category": { "id": "uuid", "name": "Grooming", "icon_url": "..." }
    }
  ]
}
```

---

### `GET /api/services/:id`

🔓 **Public** — Get service details with packages and addons.

**Success Response:** `200 OK`
```json
{
  "service": {
    "id": "uuid",
    "name": "Dog Grooming",
    "category": { "id": "uuid", "name": "Grooming" },
    "packages": [
      {
        "id": "uuid",
        "package_name": "Basic",
        "price": 300,
        "duration_minutes": 30,
        "is_instant_available": true,
        "is_scheduled_available": true,
        "sort_order": 1
      }
    ],
    "addons": [
      {
        "id": "uuid",
        "name": "Nail Trim",
        "price": 100,
        "duration_minutes": 15,
        "is_active": true
      }
    ]
  }
}
```

---

### `POST /api/services/categories`

🔒 **Admin Only** — Create a new service category.

**Request Body:**
```json
{
  "name": "Pet Sitting",
  "icon_url": "https://...",
  "sort_order": 5
}
```

---

### `POST /api/services`

🔒 **Admin Only** — Create a new service.

**Request Body:**
```json
{
  "name": "Cat Grooming",
  "description": "Professional cat grooming",
  "category_id": "uuid",
  "image_url": "https://..."
}
```

---

### `POST /api/services/:serviceId/packages`

🔒 **Admin Only** — Add a package to a service.

**Request Body:**
```json
{
  "package_name": "Premium",
  "price": 800,
  "duration_minutes": 90,
  "features": ["Bath", "Haircut", "Nail Trim"],
  "is_instant_available": true,
  "is_scheduled_available": true,
  "sort_order": 2
}
```

---

### `POST /api/services/:serviceId/addons`

🔒 **Admin Only** — Add an addon to a service.

**Request Body:**
```json
{
  "name": "Teeth Cleaning",
  "price": 200,
  "duration_minutes": 20
}
```

---

## 4. Pets

> All pet endpoints require authentication.

### `GET /api/pets`

🔒 **Protected** — List current user's pets.

**Success Response:** `200 OK`
```json
{
  "pets": [
    {
      "id": "uuid",
      "name": "Max",
      "type": "dog",
      "breed": "Labrador",
      "age": 3,
      "weight": 25.5,
      "medical_notes": "Allergic to chicken",
      "vaccination_status": "up_to_date",
      "image_url": "https://...",
      "created_at": "2026-01-01T00:00:00Z"
    }
  ]
}
```

---

### `GET /api/pets/:id`

🔒 **Protected** — Get a specific pet.

---

### `POST /api/pets`

🔒 **Protected** — Add a new pet.

**Request Body:**
```json
{
  "name": "Max",                         // required, min 1 char
  "type": "dog",                         // optional
  "breed": "Labrador",                   // optional
  "age": 3,                              // optional, integer >= 0
  "weight": 25.5,                        // optional, >= 0
  "medical_notes": "Allergic to chicken",// optional
  "vaccination_status": "up_to_date",    // optional
  "image_url": "https://..."             // optional, must be valid URL
}
```

**Success Response:** `201 Created`
```json
{
  "pet": { "id": "uuid", "name": "Max", ... }
}
```

---

### `PATCH /api/pets/:id`

🔒 **Protected** — Update a pet (all fields optional).

---

### `DELETE /api/pets/:id`

🔒 **Protected** — Soft-delete a pet.

**Success Response:** `200 OK`
```json
{
  "message": "Pet removed successfully"
}
```

---

## 5. Wallet

> All wallet endpoints require authentication.

### `GET /api/wallet`

🔒 **Protected** — Get wallet balance. Auto-creates wallet if missing.

**Success Response:** `200 OK`
```json
{
  "wallet": {
    "id": "uuid",
    "user_id": "uuid",
    "balance": 1500.00,
    "auto_recharge": false,
    "auto_recharge_threshold": 0,
    "auto_recharge_amount": 0,
    "created_at": "2026-01-01T00:00:00Z"
  }
}
```

---

### `GET /api/wallet/transactions`

🔒 **Protected** — Get transaction history.

**Query Parameters:**
| Param  | Type   | Default | Description                           |
|--------|--------|---------|---------------------------------------|
| type   | string | —       | Filter: credit, debit, refund         |
| limit  | number | 50      | Max results                           |
| offset | number | 0       | Pagination offset                     |

**Success Response:** `200 OK`
```json
{
  "transactions": [
    {
      "id": "uuid",
      "wallet_id": "uuid",
      "type": "credit",
      "amount": 500,
      "description": "Wallet top-up",
      "reference_type": "topup",
      "reference_id": null,
      "created_at": "2026-03-29T00:00:00Z"
    }
  ]
}
```

---

### `POST /api/wallet/add-funds`

🔒 **Protected** — Add funds to wallet.

**Request Body:**
```json
{
  "amount": 500,                // min 100, max 50000 (INR)
  "payment_method": "upi"      // optional
}
```

**Success Response:** `200 OK`
```json
{
  "wallet": { "id": "uuid", "balance": 2000 },
  "message": "₹500 added to your wallet"
}
```

---

### `POST /api/wallet/pay`

🔒 **Protected** — Pay for a booking from wallet balance.

**Request Body:**
```json
{
  "booking_id": "uuid",
  "amount": 500
}
```

**Business Rules:**
- Checks sufficient balance
- Creates payment record, debit transaction, and escrow entry
- Updates booking `payment_status` to `paid`

**Success Response:** `200 OK`
```json
{
  "message": "Payment successful",
  "balance": 1000
}
```

**Errors:**
| Status | Message |
|--------|---------|
| 400 | Insufficient wallet balance |
| 404 | Wallet not found |

---

### `PATCH /api/wallet/auto-recharge`

🔒 **Protected** — Update auto-recharge settings.

**Request Body:**
```json
{
  "auto_recharge": true,
  "auto_recharge_threshold": 200,    // optional, min 0
  "auto_recharge_amount": 500        // optional, min 100
}
```

---

## 6. Events

### `GET /api/events`

🔓 **Public** — List events.

**Query Parameters:**
| Param         | Type    | Default | Description              |
|---------------|---------|---------|--------------------------|
| upcoming_only | boolean | true    | Only show future events  |
| limit         | number  | 20      | Max results              |
| offset        | number  | 0       | Pagination offset        |

**Success Response:** `200 OK`
```json
{
  "events": [
    {
      "id": "uuid",
      "title": "Paws in the Park",
      "description": "...",
      "event_date": "2026-04-15T10:00:00Z",
      "location": "Central Park",
      "image_url": "https://...",
      "ticket_price": 200,
      "max_attendees": 100,
      "is_active": true
    }
  ]
}
```

---

### `GET /api/events/:id`

🔓 **Public** — Get event details with ticket availability.

**Success Response:** `200 OK`
```json
{
  "event": {
    "id": "uuid",
    "title": "Paws in the Park",
    "tickets_sold": 45,
    "spots_remaining": 55,
    ...
  }
}
```

---

### `POST /api/events/:id/purchase`

🔒 **Protected** — Purchase a ticket for an event.

**Business Rules:**
- One ticket per user per event
- Checks capacity before issuing ticket
- Generates unique QR code: `PAWBER-EVT-{eventId}-{random}`

**Success Response:** `201 Created`
```json
{
  "ticket": {
    "id": "uuid",
    "event_id": "uuid",
    "user_id": "uuid",
    "qr_code": "PAWBER-EVT-abc12345-A1B2C3D4E5F6G7H8",
    "status": "valid",
    "created_at": "2026-03-29T00:00:00Z"
  }
}
```

**Errors:**
| Status | Message |
|--------|---------|
| 404 | Event not found |
| 409 | You already have a ticket / Event is sold out |

---

### `GET /api/events/me/tickets`

🔒 **Protected** — Get current user's event tickets.

**Success Response:** `200 OK`
```json
{
  "tickets": [
    {
      "id": "uuid",
      "qr_code": "PAWBER-EVT-...",
      "status": "valid",
      "event": {
        "title": "Paws in the Park",
        "event_date": "2026-04-15T10:00:00Z",
        "location": "Central Park",
        "image_url": "https://..."
      }
    }
  ]
}
```

---

### `POST /api/events/tickets/validate`

🔒 **Protected** — Validate a ticket by QR code.

**Request Body:**
```json
{
  "qr_code": "PAWBER-EVT-abc12345-A1B2C3D4E5F6G7H8"
}
```

**Success Response:** `200 OK`
```json
{
  "valid": true,
  "message": "Ticket validated successfully",
  "ticket": { ... }
}
```

---

## 7. Notifications

> All notification endpoints require authentication.

### `GET /api/notifications`

🔒 **Protected** — List notifications.

**Query Parameters:**
| Param       | Type    | Default | Description           |
|-------------|---------|---------|----------------------|
| unread_only | boolean | false   | Only show unread     |
| limit       | number  | 50      | Max results          |
| offset      | number  | 0       | Pagination offset    |

**Success Response:** `200 OK`
```json
{
  "notifications": [
    {
      "id": "uuid",
      "title": "Booking Created!",
      "message": "Your instant booking has been created. Total: ₹500",
      "type": "booking",
      "is_read": false,
      "data": { "booking_id": "uuid" },
      "created_at": "2026-03-29T00:00:00Z"
    }
  ],
  "unread_count": 5
}
```

---

### `PATCH /api/notifications/:id/read`

🔒 **Protected** — Mark a notification as read.

---

### `PATCH /api/notifications/read-all`

🔒 **Protected** — Mark all notifications as read.

---

### `DELETE /api/notifications/:id`

🔒 **Protected** — Delete a notification.

---

## 8. Reviews

### `GET /api/reviews/provider/:providerId`

🔓 **Public** — Get reviews for a provider.

**Query Parameters:**
| Param  | Type   | Default |
|--------|--------|---------|
| limit  | number | 20      |
| offset | number | 0       |

**Success Response:** `200 OK`
```json
{
  "reviews": [
    {
      "id": "uuid",
      "rating": 5,
      "comment": "Great service!",
      "reply": null,
      "user": { "full_name": "John Doe", "avatar_url": "..." },
      "created_at": "2026-03-29T00:00:00Z"
    }
  ],
  "stats": {
    "average_rating": 4.5,
    "total_reviews": 23
  }
}
```

---

### `POST /api/reviews`

🔒 **Protected** — Create a review for a completed booking.

**Request Body:**
```json
{
  "booking_id": "uuid",
  "rating": 5,             // 1-5
  "comment": "Great!"      // optional
}
```

**Business Rules:**
- Booking must be `completed` and belong to user
- Only one review per booking

**Errors:**
| Status | Message |
|--------|---------|
| 404 | Booking not found |
| 400 | Can only review completed bookings |
| 409 | You have already reviewed this booking |

---

### `PATCH /api/reviews/:id/reply`

🔒 **Protected (Provider)** — Reply to a review.

**Request Body:**
```json
{
  "reply": "Thank you for your feedback!"
}
```

---

## 9. Providers

### `GET /api/providers`

🔓 **Public** — List approved, online providers.

**Query Parameters:**
| Param    | Type   | Default | Description                |
|----------|--------|---------|----------------------------|
| category | string | —       | Filter by category         |
| city     | string | —       | Filter by city (partial)   |
| limit    | number | 20      | Max results                |
| offset   | number | 0       | Pagination offset          |

**Success Response:** `200 OK`
```json
{
  "providers": [
    {
      "id": "uuid",
      "business_name": "Happy Paws",
      "category": "grooming",
      "rating": 4.5,
      "is_online": true,
      "city": "Bangalore",
      "user": { "full_name": "Jane Provider", "avatar_url": "..." }
    }
  ]
}
```

---

### `GET /api/providers/:id`

🔓 **Public** — Get provider details with services & reviews.

---

### `POST /api/providers/register`

🔒 **Protected** — Register as a service provider.

**Request Body:**
```json
{
  "business_name": "Happy Paws",           // required, min 2 chars
  "category": "grooming",                   // required
  "description": "Professional grooming",   // optional
  "address": "123 Pet Lane, Bangalore",     // required
  "city": "Bangalore",                      // required
  "latitude": 12.9716,                      // optional
  "longitude": 77.5946,                     // optional
  "service_radius_km": 10                   // optional, 1-100
}
```

**Success Response:** `201 Created`
```json
{
  "provider": { "id": "uuid", "status": "pending", ... },
  "message": "Registration submitted for approval"
}
```

---

### `PATCH /api/providers/me`

🔒 **Provider Only** — Update provider profile.

---

### `GET /api/providers/me`

🔒 **Provider Only** — Get own provider profile.

---

### `POST /api/providers/me/documents`

🔒 **Provider Only** — Upload a verification document.

**Request Body:**
```json
{
  "document_type": "id_proof",
  "file_url": "https://example.com/doc.pdf"
}
```

---

### `GET /api/providers/me/bookings`

🔒 **Provider Only** — List bookings assigned to the provider.

**Query Parameters:**
| Param  | Type   | Description     |
|--------|--------|-----------------|
| status | string | Filter by status |

---

### `POST /api/providers/me/services`

🔒 **Provider Only** — Add a service the provider offers.

**Request Body:**
```json
{
  "service_id": "uuid",
  "base_price": 500
}
```

---

### `GET /api/providers/:id/services`

🔓 **Public** — List services offered by a provider.

---

### `GET /api/providers/:id/bookings`

🔒 **Protected** — List bookings for a specific provider.

---

### `GET /api/providers/:id/bids` & `POST /api/providers/:id/bids`

🔒 **Protected** — Get/create bids for a provider.

---

### `GET /api/providers/:id/blocked-dates` & `POST /api/providers/:id/blocked-dates`

🔓 **Public (GET)** / 🔒 **Protected (POST)** — Manage blocked dates.

---

### `DELETE /api/providers/blocked-dates/:blockedDateId`

🔒 **Protected** — Remove a blocked date.

---

### `GET /api/providers/:id/performance`

🔓 **Public** — Get performance metrics for a provider.

---

### `GET /api/providers/:id/wallet`

🔒 **Protected** — Get provider wallet details.

---

### `GET /api/providers/:id/transactions`

🔒 **Protected** — Get provider transaction history.

---

### `GET /api/providers/:id/events`

🔓 **Public** — Get events organized by a provider.

---

### `POST /api/providers/:id/location`

🔒 **Protected** — Update provider location.

**Request Body:**
```json
{
  "latitude": 12.9716,
  "longitude": 77.5946
}
```

---

## 10. Slots

### `GET /api/slots/provider/:providerId`

🔓 **Public** — Get available time slots for a provider.

**Query Parameters:**
| Param     | Type   | Description                           |
|-----------|--------|---------------------------------------|
| date      | string | Specific date (YYYY-MM-DD)            |
| from_date | string | Range start (YYYY-MM-DD)              |
| to_date   | string | Range end (YYYY-MM-DD)                |

> Default: next 7 days if no date params provided.

**Success Response:** `200 OK`
```json
{
  "slots": [
    {
      "id": "uuid",
      "provider_id": "uuid",
      "slot_date": "2026-04-01",
      "start_time": "09:00",
      "end_time": "10:00",
      "capacity": 3,
      "booked_count": 1,
      "is_blocked": false,
      "is_available": true
    }
  ]
}
```

---

### `POST /api/slots/:slotId/lock`

🔒 **Protected** — Lock a slot for booking (5-minute hold).

**Success Response:** `200 OK`
```json
{
  "lock": { "id": "uuid", "slot_id": "uuid", ... },
  "expires_at": "2026-03-29T00:05:00Z",
  "expires_in_seconds": 300,
  "message": "Slot locked for 5 minutes. Complete your booking before it expires."
}
```

---

### `DELETE /api/slots/:slotId/lock`

🔒 **Protected** — Release a slot lock.

---

### `GET /api/slots/me`

🔒 **Provider Only** — Get provider's own slots.

**Query Parameters:** Same date filters as public endpoint.

---

### `POST /api/slots/bulk`

🔒 **Provider Only** — Create multiple time slots.

**Request Body:**
```json
{
  "slots": [
    {
      "slot_date": "2026-04-01",
      "start_time": "09:00",
      "end_time": "10:00",
      "capacity": 3
    },
    {
      "slot_date": "2026-04-01",
      "start_time": "10:00",
      "end_time": "11:00",
      "capacity": 2
    }
  ]
}
```

**Success Response:** `201 Created`
```json
{
  "slots": [...],
  "count": 2
}
```

---

### `PATCH /api/slots/:id/block`

🔒 **Provider Only** — Toggle block/unblock a slot.

---

## 11. Payments

> All payment endpoints require authentication.

### `POST /api/payments/create-order`

🔒 **Protected** — Create a Razorpay payment order.

**Request Body:**
```json
{
  "booking_id": "uuid",
  "amount": 500           // INR (converted to paise internally)
}
```

**Success Response:** `201 Created`
```json
{
  "order_id": "order_xyz",
  "amount": 50000,          // in paise
  "currency": "INR",
  "key_id": "rzp_...",
  "booking_id": "uuid"
}
```

---

### `POST /api/payments/verify`

🔒 **Protected** — Verify payment after Razorpay checkout.

**Request Body:**
```json
{
  "razorpay_order_id": "order_xyz",
  "razorpay_payment_id": "pay_xyz",
  "razorpay_signature": "hmac_signature"
}
```

**Success Response:** `200 OK`
```json
{
  "verified": true,
  "payment_id": "pay_xyz",
  "order_id": "order_xyz"
}
```

---

### `POST /api/payments/refund`

🔒 **Protected** — Request a refund.

**Request Body:**
```json
{
  "payment_id": "uuid",         // DB payment ID
  "amount": 250,                // optional (partial refund in INR)
  "reason": "Service not good"  // optional
}
```

---

### `GET /api/payments`

🔒 **Protected** — Get payment history.

**Query Parameters:**
| Param  | Type   | Default |
|--------|--------|---------|
| limit  | number | 20      |
| offset | number | 0       |

---

## 12. Chat

> All chat endpoints require authentication.

### `GET /api/chat/threads`

🔒 **Protected** — Get chat threads for the current user.

**Success Response:** `200 OK`
```json
{
  "threads": [
    {
      "id": "uuid",
      "booking_id": "uuid",
      "created_at": "2026-03-29T00:00:00Z",
      "bookings": { "id": "uuid", "status": "confirmed", "service": { "name": "..." } },
      "last_message": { "id": "uuid", "content": "Hello!", "sender_id": "uuid" }
    }
  ]
}
```

---

### `POST /api/chat/threads`

🔒 **Protected** — Create or get a chat thread for a booking.

**Request Body:**
```json
{
  "booking_id": "uuid"
}
```

---

### `GET /api/chat/threads/:threadId/messages`

🔒 **Protected** — Get messages in a thread.

**Query Parameters:**
| Param  | Type   | Default | Description               |
|--------|--------|---------|---------------------------|
| limit  | number | 50      | Max messages               |
| before | string | —       | ISO timestamp for cursor   |

---

### `POST /api/chat/threads/:threadId/messages`

🔒 **Protected** — Send a message.

**Request Body:**
```json
{
  "content": "Hello there!",                      // required, max 2000 chars
  "message_type": "text",                          // "text" | "image" | "location" | "system"
  "metadata": { "image_url": "https://..." }       // optional
}
```

---

## 13. Tracking

> All tracking endpoints require authentication.

### `POST /api/tracking/update`

🔒 **Protected (Provider Only)** — Update location during a booking.

**Request Body:**
```json
{
  "booking_id": "uuid",
  "latitude": 12.9716,
  "longitude": 77.5946,
  "accuracy": 10.5,           // optional
  "heading": 180,              // optional
  "speed": 5.2,               // optional
  "status": "on_the_way"      // optional: on_the_way, arrived, in_progress, returning
}
```

---

### `GET /api/tracking/booking/:bookingId`

🔒 **Protected** — Get latest location and full path for a booking.

**Success Response:** `200 OK`
```json
{
  "latest": {
    "latitude": 12.9716,
    "longitude": 77.5946,
    "status": "on_the_way",
    "created_at": "2026-03-29T00:00:00Z"
  },
  "path": [
    { "latitude": 12.97, "longitude": 77.59, "created_at": "...", "status": "on_the_way" }
  ]
}
```

---

### `GET /api/tracking/booking/:bookingId/info`

🔒 **Protected** — Get booking info with provider details for tracking UI.

---

## 14. Admin

> All admin endpoints require `admin` role authentication.

### `GET /api/admin/dashboard`

🔒 **Admin** — Dashboard statistics.

**Success Response:** `200 OK`
```json
{
  "stats": {
    "total_users": 150,
    "total_providers": 25,
    "total_bookings": 500,
    "total_revenue": 125000
  },
  "recent_bookings": [...],
  "pending_providers": [...]
}
```

---

### `GET /api/admin/users`

🔒 **Admin** — List all users.

**Query Parameters:**
| Param  | Type   | Default |
|--------|--------|---------|
| role   | string | —       |
| limit  | number | 50      |
| offset | number | 0       |

---

### `GET /api/admin/pets`

🔒 **Admin** — List all pets.

---

### `GET /api/admin/providers`

🔒 **Admin** — List all providers (filterable by status).

**Query Parameters:**
| Param  | Type   | Description                              |
|--------|--------|------------------------------------------|
| status | string | pending, approved, rejected, suspended   |

---

### `PATCH /api/admin/providers/:id/status`

🔒 **Admin** — Approve/Reject/Suspend a provider.

**Request Body:**
```json
{
  "status": "approved"    // "approved" | "rejected" | "suspended"
}
```

---

### `PATCH /api/admin/documents/:id/verify`

🔒 **Admin** — Verify a provider document.

**Request Body:**
```json
{
  "verification_status": "approved"    // "approved" | "rejected"
}
```

---

### `PATCH /api/admin/providers/:id/commission`

🔒 **Admin** — Update provider commission rate.

**Request Body:**
```json
{
  "commission_rate": 15     // 0-100
}
```

---

### `GET /api/admin/bookings`

🔒 **Admin** — List all bookings.

---

### `GET /api/admin/disputes`

🔒 **Admin** — List all disputes.

---

### `PATCH /api/admin/disputes/:id/resolve`

🔒 **Admin** — Resolve a dispute.

**Request Body:**
```json
{
  "resolution": "Refund issued to customer",
  "status": "resolved"                        // optional, default "resolved"
}
```

---

### `GET /api/admin/coupons`

🔒 **Admin** — List all coupons.

### `POST /api/admin/coupons`

🔒 **Admin** — Create a coupon.

**Request Body:**
```json
{
  "code": "FLAT20",
  "discount_type": "percent",       // "percent" | "flat"
  "discount_value": 20,
  "max_discount": 500,              // optional, for percent type
  "min_order_amount": 200,          // optional
  "usage_limit": 100,               // optional
  "valid_from": "2026-04-01",       // optional
  "valid_until": "2026-04-30",      // optional
  "is_active": true
}
```

---

### `POST /api/admin/events`

🔒 **Admin** — Create a new event.

**Request Body:**
```json
{
  "title": "Paws in the Park",
  "description": "Fun pet event",
  "event_date": "2026-04-15T10:00:00Z",
  "location": "Central Park",
  "image_url": "https://...",
  "ticket_price": 200,
  "max_attendees": 100
}
```

---

### `GET /api/admin/webhook-logs`

🔒 **Admin** — View webhook processing logs.

**Query Parameters:**
| Param  | Type   | Description              |
|--------|--------|--------------------------|
| source | string | Filter: razorpay, qr     |
| limit  | number | Default 50               |

---

## 15. Webhooks

### `POST /api/webhooks/razorpay`

🔓 **Public** (Razorpay server-to-server) — Handle Razorpay payment events.

**Handled Events:**
- `payment.authorized` — Payment authorized
- `payment.captured` — Payment successful → creates escrow
- `payment.failed` — Payment failed → notifies user
- `refund.processed` — Refund completed → updates records
- `refund.failed` — Refund failed (logged only)
- `order.paid` — Order fully paid → confirms booking

**Headers:**
| Header                  | Description                    |
|-------------------------|--------------------------------|
| `x-razorpay-signature`  | HMAC-SHA256 signature          |

---

### `POST /api/webhooks/qr-scan`

🔓 **Public** — Handle QR code scanning for event tickets.

**Request Body:**
```json
{
  "qr_code": "PAWBER-EVT-abc12345-A1B2C3D4E5F6G7H8"
}
```

---

## 16. Debug

### `GET /api/debug/supabase`

🔓 **Public** — Check Supabase connection status.

---

## 17. Health Check

### `GET /health`

🔓 **Public** — Root health check.

**Success Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "service": "Pawber API",
    "version": "2.0.0",
    "timestamp": "2026-03-29T13:30:00Z",
    "environment": "production"
  }
}
```

### `GET /api/health`

🔓 **Public** — API health check.

```json
{
  "success": true,
  "data": { "status": "ok" }
}
```

---

## 18. Error Handling

### Standard Error Response

```json
{
  "success": false,
  "error": {
    "message": "Human-readable error message"
  }
}
```

### Common HTTP Status Codes

| Code | Meaning                                    |
|------|--------------------------------------------|
| 200  | Success                                    |
| 201  | Created                                    |
| 400  | Bad Request / Validation Error             |
| 401  | Unauthorized (missing/invalid token)       |
| 403  | Forbidden (insufficient role)              |
| 404  | Not Found                                  |
| 409  | Conflict (duplicate, slot unavailable)     |
| 429  | Too Many Requests (rate limited)           |
| 500  | Internal Server Error                      |
| 503  | Service Unavailable (gateway not configured)|

### Rate Limiting

- **General API:** 200 requests per 15-minute window
- **Auth endpoints:** Stricter rate limiting applied

### Authentication Flow

1. Sign up or sign in → receive `access_token` and `refresh_token`
2. Include `Authorization: Bearer <access_token>` in all protected requests
3. When token expires, use `POST /api/auth/refresh` with `refresh_token`
4. On `401` response, redirect to sign-in

---

> 📝 **Note:** This API uses a PostgreSQL database via a Supabase-compatible query builder. Some routes use the module architecture (auth) while legacy routes are being migrated.
