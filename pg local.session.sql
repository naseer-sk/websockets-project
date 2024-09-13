-- Description : The notify_notifications function is used as part of a PostgreSQL trigger. 
-- Its purpose is to send a notification message to a specified PostgreSQL notification channel 
-- whenever a row in the table is inserted, updated, or deleted. The notification message 
-- contains the data of the affected row in JSON format.


-- CREATE OR REPLACE FUNCTION notify_notifications()
-- RETURNS TRIGGER AS $$
-- BEGIN 
--     PERFORM pg_notify('notifications_channel',row_to_json(NEW)::text);
--     RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;


-- Description: The notifications_trigger trigger is designed to invoke the 
-- notify_notifications function whenever a row in the notifications table is 
-- inserted, updated, or deleted. The trigger ensures that the notify_notifications
-- function is executed automatically as part of these data modification operations.

-- CREATE TRIGGER notifications_trigger
-- AFTER INSERT OR UPDATE OR DELETE
-- ON notifications
-- FOR EACH ROW
-- EXECUTE FUNCTION notify_notifications();
