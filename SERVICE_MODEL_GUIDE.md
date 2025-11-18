# Service Model Guide

## Overview
This service model supports hero sections, service items, and why choose sections.

---

## API Endpoints

### Public Endpoints
- `GET /api/v1/services` - List all services (with filtering)
- `GET /api/v1/services/category/:category` - Get services by category
- `GET /api/v1/services/slug/:slug` - Get service by slug
- `GET /api/v1/services/:id` - Get service by ID

### Admin Endpoints (Requires Authentication)
- `POST /api/v1/services` - Create service
- `PATCH /api/v1/services/:id` - Update service
- `DELETE /api/v1/services/:id` - Delete service

---

## Service Model Structure

### Basic Fields
```json
{
  "title": "Web Development",
  "slug": "web-development",
  "description": "Custom, responsive websites built with modern technologies. We create high-performance websites using React, Next.js, and Tailwind CSS.",
  "category": "web-development"
}
```

### Image Fields
- `heroImage` - Main hero section image

### Hero Section
```json
{
  "heroSection": {
    "category": "Our Services",
    "heading": "Web Development",
    "subheading": "Transform Your Business With DeveloperTag",
    "features": [
      "Responsive Design",
      "Modern Frameworks",
      "SEO Optimized"
    ]
  }
}
```

### Service Items (Sub-services)
```json
{
  "serviceItems": [
    {
      "id": 1,
      "title": "Responsive Web Design",
      "content": "We create responsive and mobile-friendly websites that adapt seamlessly to different devices, ensuring a smooth user experience.",
      "image": "/sev.png"
    },
    {
      "id": 2,
      "title": "E-Commerce Development",
      "content": "We build high-performance online stores with secure payment gateways, smooth navigation, and optimized performance.",
      "image": "/sev.png"
    }
  ]
}
```

### Why Choose Section
```json
{
  "whyChooseSection": {
    "title": "Why Choose Us",
    "items": [
      {
        "title": "Responsive Design",
        "content": "Ensuring a seamless experience across all screen sizes and devices."
      },
      {
        "title": "Frontend Development",
        "content": "Building fast and interactive user interfaces using modern frameworks."
      }
    ]
  }
}
```

---

## Complete Example Payload

```json
{
  "title": "Web Development",
  "slug": "web-development",
  "description": "We create responsive and high-performance websites using modern technologies like React, Next.js, and Tailwind CSS.",
  "category": "web-development",
  "heroSection": {
    "category": "Our Services",
    "heading": "Web Development",
    "subheading": "Transform Your Business With DeveloperTag",
    "features": ["Responsive Design", "Modern Frameworks"]
  },
  "serviceItems": [
    {
      "id": 1,
      "title": "Responsive Web Design",
      "content": "We create responsive and mobile-friendly websites...",
      "image": "/sev.png"
    }
  ],
  "whyChooseSection": {
    "title": "Why Choose Us",
    "items": [
      {
        "title": "Responsive Design",
        "content": "Ensuring a seamless experience across all screen sizes."
      }
    ]
  }
}
```

---

## Query Parameters

### List Services
```
GET /api/v1/services?page=1&limit=10&search=web&category=web-development
```

### Get by Category
```
GET /api/v1/services/category/web-development?limit=10
```

---

## File Uploads

When creating or updating services, you can upload:
- `heroImage` - Main hero image

Use `multipart/form-data` for file uploads.

---

## Categories

Supported categories:
- `web-development`
- `mobile-development`
- `desktop-development`
- `ui-ux-design`
- `ai-development`
- `erp-solutions`
- `crm-solutions`
- `saas-platforms`
- `blockchain`
- `other`

---

## Benefits

1. **Simple Structure**: Easy to understand and maintain
2. **Rich Content**: Support for hero sections, features, service items, and why choose sections
3. **Flexible**: Support multiple service items with different content
4. **Filtering**: Filter by category and search
5. **Performance**: Indexed fields for fast queries

---

## Frontend Integration

The frontend can:
1. Fetch services by slug for dynamic pages
2. Display hero sections, service items, and why choose sections
3. Filter and search services efficiently
4. Render simple why choose items with just title and content
