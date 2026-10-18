-- Icons for the default categories, shown in the records list and the charts. Only where the
-- category still has no icon, so nothing the user set is overwritten.
UPDATE `categories` SET `icon` = '🛒' WHERE `name` = 'Продукты' AND `icon` IS NULL;--> statement-breakpoint
UPDATE `categories` SET `icon` = '🚌' WHERE `name` = 'Транспорт' AND `icon` IS NULL;--> statement-breakpoint
UPDATE `categories` SET `icon` = '🏠' WHERE `name` = 'Жильё' AND `icon` IS NULL;--> statement-breakpoint
UPDATE `categories` SET `icon` = '🎉' WHERE `name` = 'Развлечения' AND `icon` IS NULL;--> statement-breakpoint
UPDATE `categories` SET `icon` = '💊' WHERE `name` = 'Здоровье' AND `icon` IS NULL;--> statement-breakpoint
UPDATE `categories` SET `icon` = '💼' WHERE `name` = 'Зарплата' AND `icon` IS NULL;--> statement-breakpoint
UPDATE `categories` SET `icon` = '📦' WHERE `name` = 'Другое' AND `icon` IS NULL;
