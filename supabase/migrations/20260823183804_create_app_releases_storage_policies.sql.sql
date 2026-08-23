-- Storage policies for the app-releases bucket
-- Public read access so anyone can download the APK
-- Only sitemaster can upload/update/delete

CREATE POLICY "Public can read app-releases"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'app-releases');

CREATE POLICY "Sitemaster can upload app-releases"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'app-releases'
    AND EXISTS (
      SELECT 1 FROM user_admin_roles
      WHERE user_admin_roles.user_id = auth.uid()
      AND user_admin_roles.role_type = 'sitemaster'
      AND user_admin_roles.active = true
    )
  );

CREATE POLICY "Sitemaster can update app-releases"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'app-releases'
    AND EXISTS (
      SELECT 1 FROM user_admin_roles
      WHERE user_admin_roles.user_id = auth.uid()
      AND user_admin_roles.role_type = 'sitemaster'
      AND user_admin_roles.active = true
    )
  )
  WITH CHECK (
    bucket_id = 'app-releases'
    AND EXISTS (
      SELECT 1 FROM user_admin_roles
      WHERE user_admin_roles.user_id = auth.uid()
      AND user_admin_roles.role_type = 'sitemaster'
      AND user_admin_roles.active = true
    )
  );

CREATE POLICY "Sitemaster can delete app-releases"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'app-releases'
    AND EXISTS (
      SELECT 1 FROM user_admin_roles
      WHERE user_admin_roles.user_id = auth.uid()
      AND user_admin_roles.role_type = 'sitemaster'
      AND user_admin_roles.active = true
    )
  );
