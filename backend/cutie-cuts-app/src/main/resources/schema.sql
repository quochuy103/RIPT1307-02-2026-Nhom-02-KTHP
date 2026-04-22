alter table if exists users
    add column if not exists deleted boolean;

update users
set deleted = false
where deleted is null;

alter table if exists users
    alter column deleted set default false;

alter table if exists users
    alter column deleted set not null;

alter table if exists users
    add column if not exists deleted_at timestamp;