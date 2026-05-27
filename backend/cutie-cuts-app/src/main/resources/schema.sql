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

alter table if exists users
    add column if not exists gender varchar(20);

alter table if exists users
    add column if not exists address text;

alter table if exists users
    add column if not exists credentials_updated_at timestamp;

create table if not exists revoked_tokens
(
    id          bigserial primary key,
    jti         varchar(255) not null unique,
    user_id     bigint not null references users (id),
    reason      varchar(100) not null,
    revoked_at  timestamp not null default current_timestamp,
    expires_at  timestamp not null
);

create index if not exists idx_revoked_tokens_jti on revoked_tokens (jti);
create index if not exists idx_revoked_tokens_user on revoked_tokens (user_id);
create index if not exists idx_revoked_tokens_expires_at on revoked_tokens (expires_at);

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

alter table if exists services
    add column if not exists display_price varchar(50);


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
    transaction_id  varchar(100),
    expired_at      timestamp,
    paid_at         timestamp,
    created_at      timestamp                    default current_timestamp,
    updated_at      timestamp                    default current_timestamp
);

alter table if exists payments
    add column if not exists transaction_id varchar(100);

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

-- Relax old verified column so Hibernate INSERTs without it succeed
alter table if exists user_auth alter column verified drop not null;
alter table if exists user_auth alter column verified set default true;

-- Password Reset OTP columns on user_auth
alter table if exists user_auth
    add column if not exists reset_otp_hash varchar(128);

alter table if exists user_auth
    add column if not exists reset_otp_expiry timestamp;

alter table if exists user_auth
    add column if not exists reset_otp_attempts int not null default 0;

alter table if exists user_auth
    add column if not exists reset_otp_last_sent_at timestamp;

-- Email Verification columns on user_auth
alter table if exists user_auth
    add column if not exists email_verified boolean not null default true;

alter table if exists user_auth
    add column if not exists verification_otp_hash varchar(128);

alter table if exists user_auth
    add column if not exists verification_otp_expiry timestamp;

alter table if exists user_auth
    add column if not exists verification_otp_attempts int not null default 0;

alter table if exists user_auth
    add column if not exists verification_otp_last_sent_at timestamp;

create unique index if not exists idx_booking_active_slot_unique
    on bookings (barber_id, "date", "time")
    where lower(status) <> 'cancelled';

-- Reviews
create table if not exists reviews (
    id          bigserial primary key,
    user_id     bigint not null references users(id),
    booking_id  bigint references bookings(id),
    service_id  bigint references services(id),
    barber_id   bigint references barbers(id),
    order_id    bigint references orders(id),
    product_id  bigint references products(id),
    rating      integer not null,
    comment     varchar(2000) not null,
    created_at  timestamp default current_timestamp,
    deleted     boolean not null default false,
    deleted_at  timestamp
);

alter table if exists reviews
    add column if not exists order_id bigint;

alter table if exists reviews
    add column if not exists product_id bigint;

alter table if exists reviews
    add column if not exists deleted boolean;

update reviews
set deleted = false
where deleted is null;

alter table if exists reviews
    alter column deleted set default false;

alter table if exists reviews
    alter column deleted set not null;

alter table if exists reviews
    add column if not exists deleted_at timestamp;

create index if not exists idx_review_user on reviews(user_id);
create index if not exists idx_review_product on reviews(product_id);
create index if not exists idx_review_order on reviews(order_id);

create unique index if not exists ux_review_booking
    on reviews(booking_id)
    where booking_id is not null;

create unique index if not exists uk_review_order_product
    on reviews(order_id, product_id)
    where order_id is not null and product_id is not null;

-- Notifications
create table if not exists notifications (
    id              bigserial primary key,
    user_id         bigint not null references users(id),
    type            varchar(255) not null,
    message         varchar(255) not null,
    reference_type  varchar(255),
    reference_id    bigint,
    is_read         boolean not null default false,
    created_at      timestamp default current_timestamp
);

create index if not exists idx_notification_user on notifications(user_id);
create index if not exists idx_notification_user_read on notifications(user_id, is_read);

-- User addresses
create table if not exists user_addresses (
    id              bigserial primary key,
    user_id         bigint not null references users(id),
    recipient_name  varchar(100),
    phone           varchar(20),
    address_line    varchar(500) not null,
    ward            varchar(255),
    district        varchar(255),
    city            varchar(255) not null,
    note            varchar(500),
    is_default      boolean not null default false,
    deleted         boolean not null default false,
    deleted_at      timestamp,
    created_at      timestamp,
    updated_at      timestamp
);

create index if not exists idx_user_addresses_user on user_addresses(user_id);
create index if not exists idx_user_addresses_user_default on user_addresses(user_id, is_default);

create unique index if not exists ux_user_addresses_one_default
    on user_addresses(user_id)
    where is_default = true and deleted = false;
