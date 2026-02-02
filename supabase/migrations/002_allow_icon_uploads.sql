-- Allow icon image uploads to app-files/icons/
CREATE POLICY "Authenticated users can upload icons"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'app-files'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = 'icons'
    AND (
      lower(storage.extension(name)) = 'png'
      OR lower(storage.extension(name)) = 'jpg'
      OR lower(storage.extension(name)) = 'jpeg'
      OR lower(storage.extension(name)) = 'webp'
    )
  );
