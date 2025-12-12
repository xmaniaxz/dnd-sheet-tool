# Appwrite Storage Setup for Profile Pictures

To enable profile picture uploads, you need to create a Storage bucket in your Appwrite console.

## Steps:

1. Go to your Appwrite Console
2. Navigate to **Storage** in the left sidebar
3. Click **Create bucket**
4. Use these settings:
   - **Bucket ID**: `profile-pictures` (or your custom ID)
   - **Name**: Profile Pictures
   - **File Security**: Enabled
   - **Maximum File Size**: 5MB (5242880 bytes)
   - **Allowed File Extensions**: jpg, jpeg, png, gif, webp
   - **Compression**: Optional (recommended: gzip)
   - **Encryption**: Enabled (recommended)
   - **Antivirus**: Enabled (recommended if available)

5. Set **Permissions**:
   - **Read Access**: `Any` (so users can view profile pictures)
   - **Create Access**: `Users` (authenticated users can upload)
   - **Update Access**: `Users` (authenticated users can update their uploads)
   - **Delete Access**: `Users` (authenticated users can delete their uploads)

6. Add the bucket ID to your `.env.local` file:
   ```
   NEXT_PUBLIC_APPWRITE_PROFILE_BUCKET_ID=profile-pictures
   ```

## How it works:

- When a user uploads an image file, it's stored in Appwrite Storage
- The storage returns a file URL which is stored in the character's `profilePicture` field (max 2048 chars)
- When a user provides a URL, it's stored directly (must be under 2048 chars)
- This keeps the database lean while supporting both uploaded files and external URLs

## Database Schema:

The `profilePicture` attribute in your characters collection should be:
- **Type**: String
- **Size**: 2048 characters
- **Required**: No
- **Default**: null
