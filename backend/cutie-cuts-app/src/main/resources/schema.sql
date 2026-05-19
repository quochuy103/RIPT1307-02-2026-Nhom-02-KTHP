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

-- Add deleted columns to products table
alter table if exists products
    add column if not exists deleted boolean;

update products
set deleted = false
where deleted is null;

alter table if exists products
    alter column deleted set default false;

alter table if exists products
    alter column deleted set not null;

alter table if exists products
    add column if not exists deleted_at timestamp;


alter table if exists barbers
    alter column image type text;

-- Add deleted columns to barbers table
alter table if exists barbers
    add column if not exists deleted boolean;

update barbers
set deleted = false
where deleted is null;

alter table if exists barbers
    alter column deleted set default false;

alter table if exists barbers
    alter column deleted set not null;

alter table if exists barbers
    add column if not exists deleted_at timestamp;

-- Add deleted columns to services table
alter table if exists services
    add column if not exists deleted boolean;

update services
set deleted = false
where deleted is null;

alter table if exists services
    alter column deleted set default false;

alter table if exists services
    alter column deleted set not null;

alter table if exists services
    add column if not exists deleted_at timestamp;


-- Payment tables
create table if not exists payments
(
    id              bigserial primary key,
    payment_code    varchar(100) unique not null,
    order_id        bigint              not null,
    user_id         bigint              not null,
    amount          decimal(10, 2)      not null,
    status          varchar(20)         not null default 'PENDING',
    qr_code_url     text,
    qr_data_url     text,
    bank_account    varchar(50),
    bank_code       varchar(20),
    bank_name       varchar(100),
    payment_method  varchar(50),
    expired_at      timestamp,
    paid_at         timestamp,
    created_at      timestamp                    default current_timestamp,
    updated_at      timestamp                    default current_timestamp
);

create table if not exists payment_transactions
(
    id                bigserial primary key,
    payment_id        bigint not null,
    transaction_code  varchar(100),
    amount            decimal(10, 2),
    description       text,
    bank_code         varchar(20),
    transaction_date  timestamp,
    raw_data          text,
    created_at        timestamp default current_timestamp
);

create index if not exists idx_payment_code on payments (payment_code);
create index if not exists idx_payment_user on payments (user_id);
create index if not exists idx_payment_order on payments (order_id);
create index if not exists idx_payment_status on payments (status);
create index if not exists idx_transaction_payment on payment_transactions (payment_id);
create index if not exists idx_transaction_code on payment_transactions (transaction_code);

alter table if exists bookings
    alter column "time" type time(6)
    using "time"::time(6);

alter table if exists bookings
    drop constraint if exists uk_booking_barber_date_time;

drop index if exists idx_booking_active_slot_unique;

create unique index if not exists idx_booking_active_slot_unique
    on bookings (barber_id, "date", "time")
    where lower(status) <> 'cancelled';
