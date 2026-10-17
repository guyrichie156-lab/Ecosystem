-- The app's money has always been Belarusian rubles; rows were only labelled RUB. Relabel, don't convert.
UPDATE `accounts` SET `currency` = 'BYN' WHERE `currency` = 'RUB';--> statement-breakpoint
UPDATE `transactions` SET `currency` = 'BYN' WHERE `currency` = 'RUB';
