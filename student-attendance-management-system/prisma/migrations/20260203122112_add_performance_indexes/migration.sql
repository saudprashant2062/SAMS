-- CreateIndex
CREATE INDEX "AttendanceRecord_student_id_idx" ON "AttendanceRecord"("student_id");

-- CreateIndex
CREATE INDEX "AttendanceRecord_status_idx" ON "AttendanceRecord"("status");

-- CreateIndex
CREATE INDEX "AttendanceRecord_is_deleted_idx" ON "AttendanceRecord"("is_deleted");

-- CreateIndex
CREATE INDEX "AttendanceSession_teaching_assignment_id_idx" ON "AttendanceSession"("teaching_assignment_id");

-- CreateIndex
CREATE INDEX "AttendanceSession_session_date_idx" ON "AttendanceSession"("session_date");

-- CreateIndex
CREATE INDEX "AttendanceSession_is_deleted_idx" ON "AttendanceSession"("is_deleted");

-- CreateIndex
CREATE INDEX "PasswordReset_userId_idx" ON "PasswordReset"("userId");

-- CreateIndex
CREATE INDEX "PasswordReset_expiresAt_idx" ON "PasswordReset"("expiresAt");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "RefreshToken_expiresAt_idx" ON "RefreshToken"("expiresAt");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_is_active_idx" ON "User"("is_active");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");
