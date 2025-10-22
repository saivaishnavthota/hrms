# SSL Certificate Setup Guide

## Overview
This guide explains how to set up SSL certificates for your HRMS application running on `149.102.158.71`.

## Files You Need
1. **SSL Certificate** (from your Certificate Authority)
2. **Private Key** (generated when you created the CSR)
3. **Certificate Chain** (if provided by your CA)

## Step 1: Place SSL Certificate Files

### Create the SSL directory structure:
```bash
mkdir -p nginx/ssl
```

### Place your certificate files in `nginx/ssl/`:

```
nginx/ssl/
├── certificate.crt    # Your SSL certificate from CA
├── private.key        # Your private key
└── ca-bundle.crt      # Certificate chain (if provided)
```

### File Naming Convention:
- **Certificate**: `certificate.crt` or `your-domain.crt`
- **Private Key**: `private.key` or `your-domain.key`
- **Certificate Chain**: `ca-bundle.crt` or `intermediate.crt`

## Step 2: Set Proper File Permissions

```bash
# Set secure permissions for private key
chmod 600 nginx/ssl/private.key

# Set read permissions for certificate files
chmod 644 nginx/ssl/certificate.crt
chmod 644 nginx/ssl/ca-bundle.crt
```

## Step 3: Verify Certificate Files

### Check certificate validity:
```bash
# Check certificate details
openssl x509 -in nginx/ssl/certificate.crt -text -noout

# Check certificate expiration
openssl x509 -in nginx/ssl/certificate.crt -noout -dates

# Verify certificate matches private key
openssl x509 -noout -modulus -in nginx/ssl/certificate.crt | openssl md5
openssl rsa -noout -modulus -in nginx/ssl/private.key | openssl md5
```

## Step 4: Update Nginx Configuration (Already Done)

The nginx configuration has been updated to:
- Listen on port 443 (HTTPS)
- Redirect HTTP (port 80) to HTTPS
- Use your SSL certificate files
- Include security headers

## Step 5: Update Environment Variables (Already Done)

The following environment variables have been updated:
- `BACKEND_URL=https://149.102.158.71`
- `FRONTEND_URL=https://149.102.158.71`
- `ENTRA_REDIRECT_URI=https://149.102.158.71/oauth2/redirect/microsoft`
- `VITE_API_BASE_URL=https://149.102.158.71`
- `VITE_API_URL=https://149.102.158.71`

## Step 6: Deploy with SSL

### Using Docker Compose:
```bash
# Stop existing containers
docker-compose -f docker-compose.prod.yml down

# Rebuild and start with SSL
docker-compose -f docker-compose.prod.yml up --build -d

# Check logs
docker-compose -f docker-compose.prod.yml logs -f nginx
```

## Step 7: Test SSL Configuration

### 1. Test HTTPS connectivity:
```bash
# Test SSL certificate
openssl s_client -connect 149.102.158.71:443 -servername 149.102.158.71

# Test HTTP to HTTPS redirect
curl -I http://149.102.158.71
# Should return: HTTP/1.1 301 Moved Permanently
```

### 2. Test in browser:
- Navigate to `https://149.102.158.71`
- Check for SSL lock icon
- Verify no certificate warnings

### 3. Test API endpoints:
```bash
# Test API over HTTPS
curl -k https://149.102.158.71/users/login
```

## Step 8: Update Azure Entra ID Configuration

### In Azure Portal:
1. Go to **App Registrations** → Your App
2. Navigate to **Authentication**
3. Update **Redirect URIs**:
   - Remove: `http://149.102.158.71:2343/oauth2/redirect/microsoft`
   - Add: `https://149.102.158.71/oauth2/redirect/microsoft`
4. Save changes

## Troubleshooting

### Issue 1: Certificate not found
**Error**: `SSL: error:02001002:system library:fopen:No such file or directory`

**Solution**: 
- Verify certificate files are in `nginx/ssl/`
- Check file permissions
- Ensure Docker volume mounting is correct

### Issue 2: Private key mismatch
**Error**: `SSL: error:0B080074:x509 certificate routines:X509_check_private_key:key values mismatch`

**Solution**:
- Verify certificate and private key match
- Use the verification commands in Step 3

### Issue 3: Certificate chain issues
**Error**: `SSL: error:14094410:SSL routines:ssl3_read_bytes:sslv3 alert handshake failure`

**Solution**:
- Include intermediate certificates in `ca-bundle.crt`
- Update nginx config to include certificate chain

### Issue 4: CORS errors with HTTPS
**Error**: CORS policy blocks requests

**Solution**:
- Verify CORS origins include HTTPS URLs
- Check environment variables are updated

## Security Best Practices

1. **File Permissions**: Keep private key secure (600)
2. **Certificate Renewal**: Set up automatic renewal before expiration
3. **Security Headers**: Already configured in nginx
4. **HTTPS Only**: HTTP redirects to HTTPS
5. **Strong Ciphers**: Modern TLS protocols only

## Monitoring

### Check SSL certificate expiration:
```bash
# Check certificate expiration date
echo | openssl s_client -connect 149.102.158.71:443 2>/dev/null | openssl x509 -noout -dates
```

### Monitor SSL logs:
```bash
# Check nginx SSL logs
docker-compose -f docker-compose.prod.yml logs nginx | grep SSL
```

## Next Steps

1. **Place your SSL certificate files** in `nginx/ssl/`
2. **Set proper file permissions**
3. **Deploy the updated configuration**
4. **Test HTTPS connectivity**
5. **Update Azure Entra ID redirect URI**
6. **Monitor certificate expiration**

Your application will then be accessible at `https://149.102.158.71` with full SSL encryption.
