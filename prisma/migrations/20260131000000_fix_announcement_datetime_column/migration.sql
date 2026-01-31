-- Fix: dateTime column was created as DATETIME but schema defines it as String (TEXT).
-- Prisma engine rejects string values written to a DATETIME-typed column.
-- SQLite doesn't support ALTER COLUMN, so we recreate the table.

CREATE TABLE "Announcement_new" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL DEFAULT 'Next Book Club Meeting',
    "location" TEXT NOT NULL,
    "dateTime" TEXT NOT NULL,
    "timeZone" TEXT NOT NULL DEFAULT 'America/Chicago',
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

INSERT INTO "Announcement_new" ("id", "title", "location", "dateTime", "timeZone", "notes", "isActive", "createdAt", "updatedAt")
    SELECT "id", "title", "location", "dateTime", "timeZone", "notes", "isActive", "createdAt", "updatedAt" FROM "Announcement";

DROP TABLE "Announcement";

ALTER TABLE "Announcement_new" RENAME TO "Announcement";
