create table if not exists users (
    id bigserial primary key,
    name varchar(255) not null,
    phone varchar(255),
    gender varchar(20),
    address text,
    avatar_url text,
    role varchar(50) not null default 'USER',
    created_at timestamp default current_timestamp,
    deleted boolean not null default false,
    deleted_at timestamp,
    credentials_updated_at timestamp
);

create table if not exists services (
    id bigserial primary key,
    name varchar(255) not null,
    price integer not null,
    duration integer not null,
    category varchar(255) not null,
    description varchar(1000) not null,
    image text,
    created_at timestamp default current_timestamp,
    deleted boolean not null default false,
    deleted_at timestamp
);

create table if not exists barbers (
    id bigserial primary key,
    name varchar(255) not null,
    role varchar(255) not null,
    image text,
    experience integer not null,
    specialties varchar(255) not null,
    rating double precision not null default 4.8,
    created_at timestamp default current_timestamp,
    deleted boolean not null default false,
    deleted_at timestamp
);

create table if not exists products (
    id bigserial primary key,
    name varchar(255) not null,
    price double precision not null,
    image text not null,
    rating double precision not null default 4.5,
    category varchar(255) not null,
    description varchar(1000) not null,
    stock integer not null default 0,
    created_at timestamp default current_timestamp,
    deleted boolean not null default false,
    deleted_at timestamp
);

create table if not exists gallery (
    id bigserial primary key,
    url text not null,
    alt varchar(255) not null,
    category varchar(255) not null,
    uploaded_at timestamp default current_timestamp,
    deleted boolean not null default false,
    deleted_at timestamp
);

create table if not exists user_auth (
    id bigserial primary key,
    auth_type varchar(255) not null,
    auth_value varchar(255) not null,
    password_hash varchar(255),
    verified boolean default true,
    email_verified boolean not null default true,
    reset_otp_hash varchar(128),
    reset_otp_expiry timestamp,
    reset_otp_attempts integer not null default 0,
    reset_otp_last_sent_at timestamp,
    verification_otp_hash varchar(128),
    verification_otp_expiry timestamp,
    verification_otp_attempts integer not null default 0,
    verification_otp_last_sent_at timestamp,
    created_at timestamp default current_timestamp,
    user_id bigint not null references users(id),
    constraint uk_user_auth_type_value unique (auth_type, auth_value)
);

create table if not exists revoked_tokens (
    id bigserial primary key,
    jti varchar(255) not null unique,
    user_id bigint not null references users(id),
    reason varchar(100) not null,
    revoked_at timestamp not null default current_timestamp,
    expires_at timestamp not null
);

create table if not exists bookings (
    id bigserial primary key,
    user_id bigint not null references users(id),
    service_id bigint not null references services(id),
    barber_id bigint not null references barbers(id),
    "date" date not null,
    "time" time(6) not null,
    status varchar(50) not null default 'pending',
    price double precision not null,
    created_at timestamp default current_timestamp,
    cancelled_at timestamp
);

create table if not exists notifications (
    id bigserial primary key,
    user_id bigint not null references users(id),
    type varchar(255) not null,
    message text not null,
    reference_type varchar(255),
    reference_id bigint,
    is_read boolean not null default false,
    created_at timestamp default current_timestamp
);

create table if not exists orders (
    id bigserial primary key,
    user_id bigint not null references users(id),
    total_price double precision not null,
    address text not null,
    status varchar(50) not null default 'pending',
    created_at timestamp default current_timestamp
);

create table if not exists order_items (
    id bigserial primary key,
    order_id bigint not null references orders(id) on delete cascade,
    product_id bigint not null references products(id),
    quantity integer not null,
    price double precision not null
);

create table if not exists payments (
    id bigserial primary key,
    payment_code varchar(100) not null unique,
    order_id bigint not null references orders(id),
    user_id bigint not null references users(id),
    amount double precision not null,
    status varchar(20) not null default 'PENDING',
    qr_code_url text,
    qr_data_url text,
    bank_account varchar(50),
    bank_code varchar(20),
    bank_name varchar(100),
    payment_method varchar(20) default 'VIETQR',
    transaction_id varchar(100),
    expired_at timestamp,
    paid_at timestamp,
    created_at timestamp default current_timestamp,
    updated_at timestamp default current_timestamp
);

alter table if exists payments
    add column if not exists transaction_id varchar(100);

create table if not exists payment_transactions (
    id bigserial primary key,
    payment_id bigint not null references payments(id),
    transaction_code varchar(100),
    amount double precision,
    description text,
    bank_code varchar(20),
    transaction_date timestamp,
    raw_data text,
    created_at timestamp default current_timestamp
);

create table if not exists reviews (
    id bigserial primary key,
    user_id bigint not null references users(id),
    booking_id bigint unique references bookings(id),
    service_id bigint references services(id),
    barber_id bigint references barbers(id),
    order_id bigint references orders(id),
    product_id bigint references products(id),
    rating integer not null,
    comment varchar(2000) not null,
    created_at timestamp default current_timestamp,
    deleted boolean not null default false,
    deleted_at timestamp,
    constraint uk_review_order_product unique (order_id, product_id)
);

create table if not exists user_addresses (
    id bigserial primary key,
    user_id bigint not null references users(id),
    recipient_name varchar(100),
    phone varchar(20),
    address_line varchar(500) not null,
    ward varchar(255),
    district varchar(255),
    city varchar(255) not null,
    note varchar(500),
    is_default boolean not null default false,
    deleted boolean not null default false,
    deleted_at timestamp,
    created_at timestamp default current_timestamp,
    updated_at timestamp default current_timestamp
);

create index if not exists idx_service_deleted on services (deleted);
create index if not exists idx_barber_deleted on barbers (deleted);
create index if not exists idx_product_deleted on products (deleted);
create index if not exists idx_product_category on products (category);
create index if not exists idx_user_auth_user on user_auth (user_id);
create index if not exists idx_revoked_tokens_jti on revoked_tokens (jti);
create index if not exists idx_revoked_tokens_user on revoked_tokens (user_id);
create index if not exists idx_revoked_tokens_expires_at on revoked_tokens (expires_at);
create index if not exists idx_booking_user on bookings (user_id);
create index if not exists idx_booking_barber on bookings (barber_id);
create index if not exists idx_booking_service on bookings (service_id);
create unique index if not exists idx_booking_active_slot_unique
    on bookings (barber_id, "date", "time")
    where lower(status) <> 'cancelled';
create index if not exists idx_notification_user on notifications (user_id);
create index if not exists idx_notification_user_read on notifications (user_id, is_read);
create index if not exists idx_order_user on orders (user_id);
create index if not exists idx_item_order on order_items (order_id);
create index if not exists idx_item_product on order_items (product_id);
create index if not exists idx_payment_code on payments (payment_code);
create index if not exists idx_payment_order on payments (order_id);
create index if not exists idx_payment_user on payments (user_id);
create index if not exists idx_payment_status on payments (status);
create index if not exists idx_transaction_payment on payment_transactions (payment_id);
create index if not exists idx_transaction_code on payment_transactions (transaction_code);
create index if not exists idx_review_user on reviews (user_id);
create index if not exists idx_review_product on reviews (product_id);
create index if not exists idx_review_order on reviews (order_id);
create index if not exists idx_user_addresses_user on user_addresses (user_id);
create index if not exists idx_user_addresses_user_default on user_addresses (user_id, is_default);
create unique index if not exists ux_user_addresses_one_default
    on user_addresses(user_id)
    where is_default = true and deleted = false;
