# Employee Assets in Profile Implementation

## Overview
Added the ability to display allocated assets for employees in their profile section.

## Changes Made

### Backend Changes

#### 1. New API Endpoint
- **File**: `Backend/routes/asset_routes.py`
- **Endpoint**: `GET /assets/employee/{employee_id}/assets`
- **Description**: Returns all assets allocated to a specific employee with detailed information
- **Response**: List of assets with allocation details including:
  - Asset information (name, tag, type, brand, model, serial number)
  - Allocation details (date, expected return, condition)
  - Status and acknowledgment information

### Frontend Changes

#### 1. Profile Component Updates
- **File**: `Frontend/src/components/Profile/MyProfile.jsx`
- **Changes**:
  - Added new state for `allocatedAssets`
  - Added API call to fetch employee assets
  - Added asset display section in profile
  - Added helper functions for asset icons and status colors
  - Added date formatting utility

#### 2. New Features Added
- **Asset Icons**: Dynamic icons based on asset type (laptop, monitor, phone, etc.)
- **Status Badges**: Color-coded status indicators
- **Asset Cards**: Detailed display of each allocated asset
- **Information Display**: Shows allocation date, expected return, condition, and acknowledgment status

## Asset Information Displayed

For each allocated asset, the profile shows:
- Asset name and type
- Brand and model information
- Asset tag and serial number
- Current status (Allocated, In Stock, Under Repair, etc.)
- Allocation date
- Expected return date
- Asset condition
- Employee acknowledgment status
- Additional notes (if any)

## Visual Features

- **Dynamic Icons**: Different icons for different asset types
- **Status Colors**: 
  - Green for "Allocated"
  - Blue for "In Stock"
  - Yellow for "Under Repair"
  - Red for "Scrapped"
  - Gray for "Returned"
- **Responsive Layout**: Grid layout for asset information
- **Clean Design**: Card-based layout with proper spacing

## API Integration

The frontend makes a GET request to `/assets/employee/{employeeId}/assets` to fetch the allocated assets for the current user. The data is fetched when the profile loads and is refreshed when the user clicks the "Refresh Profile" button.

## Error Handling

- Graceful error handling for API failures
- Toast notifications for errors
- Fallback display when no assets are allocated
- Loading states during data fetching

## Usage

Employees can now view all their allocated assets directly in their profile section, providing a comprehensive view of company assets assigned to them. This helps with:
- Asset tracking
- Return date awareness
- Condition monitoring
- Acknowledgment status tracking
