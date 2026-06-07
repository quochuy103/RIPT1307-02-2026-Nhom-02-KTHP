# -*- coding: utf-8 -*-
import copy
import sys
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
XML_NS = "http://www.w3.org/XML/1998/namespace"
ET.register_namespace("w", W_NS)
ns = {"w": W_NS}
W = "{%s}" % W_NS


def load_doc(path: Path):
    with zipfile.ZipFile(path, "r") as zin:
        root = ET.fromstring(zin.read("word/document.xml"))
    body = root.find("w:body", ns)
    return root, body


def el_at(body, idx: int):
    return list(body)[idx - 1]


def set_p_text(p, text: str):
    p_pr = p.find("w:pPr", ns)
    for child in list(p):
        if child is not p_pr:
            p.remove(child)
    r = ET.Element(W + "r")
    t = ET.SubElement(r, W + "t")
    if text.startswith(" ") or text.endswith(" ") or "  " in text:
        t.set("{%s}space" % XML_NS, "preserve")
    t.text = text
    p.append(r)


def set_cell_text(tc, text: str):
    paras = tc.findall("w:p", ns)
    if paras:
        set_p_text(paras[0], text)
        for extra in paras[1:]:
            tc.remove(extra)
    else:
        p = ET.Element(W + "p")
        set_p_text(p, text)
        tc.append(p)


def insert_after(body, ref, new_el):
    idx = list(body).index(ref)
    body.insert(idx + 1, new_el)


def save_doc(src: Path, dst: Path, root):
    xml_bytes = ET.tostring(root, encoding="utf-8", xml_declaration=True)
    with zipfile.ZipFile(src, "r") as zin, zipfile.ZipFile(dst, "w", zipfile.ZIP_DEFLATED) as zout:
        for item in zin.infolist():
            data = xml_bytes if item.filename == "word/document.xml" else zin.read(item.filename)
            zout.writestr(item, data)


def main():
    if len(sys.argv) != 3:
        raise SystemExit("usage: fix_report_docx_utf8.py <src.docx> <dst.docx>")

    src = Path(sys.argv[1])
    dst = Path(sys.argv[2])
    root, body = load_doc(src)

    actor_tbl = el_at(body, 38)
    assign_tbl = el_at(body, 54)
    fig_gallery = el_at(body, 133)
    admin_heading_template = el_at(body, 139)
    admin_body_template = el_at(body, 140)
    admin_fig_template = el_at(body, 142)
    api_heading = el_at(body, 159)
    api_tbl = el_at(body, 160)
    test_tbl = el_at(body, 167)
    appendix_tbl = el_at(body, 188)

    actor_rows = actor_tbl.findall("w:tr", ns)
    barber_cells = actor_rows[3].findall("w:tc", ns)
    set_cell_text(
        barber_cells[1],
        "Hỗ trợ vận hành, theo dõi lịch hẹn và thông tin barber ở mức dữ liệu/quy trình nội bộ; báo cáo này chưa triển khai cổng riêng biệt cho barber.",
    )

    assign_rows = assign_tbl.findall("w:tr", ns)
    assignment_updates = [
        [
            "[Cần bổ sung]",
            "Phạm Quốc Huy (GitHub: quochuy103)",
            "Frontend Developer chính; quản lý PR/Code Review",
            "Phụ trách giao diện người dùng, tích hợp API frontend, i18n, các trang cá nhân/admin và hỗ trợ deploy Netlify, xử lý lỗi CORS, notification localization.",
            "`main`, `feat/deploy_netlify`, `feat/notification-ui`, `feat/image-cropper-uploader`, `feat/caching-db`, `fix/corsblock`, `fix/review`",
        ],
        [
            "[Cần bổ sung]",
            "Phạm Tiến Đạt (GitHub: Hawkeon)",
            "Backend Developer; Security/Infrastructure",
            "Phụ trách CRUD API, RBAC, rate limiting, upload ảnh qua backend proxy, MinIO/S3, schema database, Swagger và một phần hoàn thiện notification/upload flow ở giai đoạn cuối.",
            "`feat/backend-image-upload-proxy`, `fix/vm-public-port-config`, `feat/repositive`, `fix/api-prefix-security-consistency`, `fix/remaining-api-filters`",
        ],
        [
            "[Cần bổ sung]",
            "Nguyễn Đức Anh (GitHub: ducanhudu)",
            "Backend Developer chính; DevOps",
            "Phụ trách backend nền tảng, JWT/OAuth, Payment/VietQR, booking logic, Docker/deploy, cấu hình môi trường và một số đợt tích hợp/final polish phía frontend.",
            "`f/payment`, `f/blacklist-jwt`, `f/cancel-booking+order`, `f/profile`, `f/review`, `feat/forgot-password-reset-flow`, `feat/gmail-smtp-otp-email`, `feat/user-addresses`, `fix/google-oauth`",
        ],
    ]
    for row, values in zip(assign_rows[1:4], assignment_updates):
        cells = row.findall("w:tc", ns)
        for cell, value in zip(cells, values):
            set_cell_text(cell, value)

    set_p_text(
        el_at(body, 57),
        "Phạm Quốc Huy phụ trách chính phần giao diện và trải nghiệm người dùng: AuthPage, BookingPage, ServicesPage, ShopPage, CheckoutPage, MyOrdersPage, MyBookingsPage, ProfilePage, Navbar, i18n, ProtectedRoute/AdminRoute, tích hợp API cho các màn hình admin, QR payment UI, image cropper/uploader và phần localize notification.",
    )
    set_p_text(
        el_at(body, 58),
        "Phạm Tiến Đạt phụ trách backend và hạ tầng bảo mật: CRUD API cho barber, service, product, notification, user address; Spring Security; RBAC; rate limiting; backend proxy upload ảnh; MinIO/S3; schema database; filtering/pagination; Swagger/OpenAPI; Data Initializer; cùng một số chỉnh sửa cuối cho notification bell, upload FormData và cấu hình deploy/proxy.",
    )
    set_p_text(
        el_at(body, 59),
        "Nguyễn Đức Anh phụ trách backend nền tảng và DevOps: thiết kế entities, repositories, controllers, JWT authentication, Google OAuth, logout/JWT blacklist, Payment/VietQR, booking rules, hủy booking/order, User Profile backend, Review API, Dockerfile, docker-compose, nginx, biến môi trường, README và một số đợt tích hợp/final polish như điều hướng trang, làm mới/phân trang notification và cập nhật Footer/Contact.",
    )
    note_para = copy.deepcopy(el_at(body, 60))
    set_p_text(
        note_para,
        "Lưu ý khi đối chiếu lịch sử Git: Phạm Quốc Huy xuất hiện qua các alias `Phạm Quốc Huy`, `quochuy103`, `phamhuy`; Nguyễn Đức Anh qua `Duc Anh`, `ducanhudu`; Phạm Tiến Đạt qua `Hawkeon`, `Sleepy_Engineer`. Bot `gpt-engineer-app[bot]` và commit template `Lovable` không được tính là thành viên nhóm.",
    )
    insert_after(body, el_at(body, 60), note_para)

    set_p_text(
        el_at(body, 79),
        "Sau khi người dùng tạo đơn hàng, hệ thống sinh payment record và gọi VietQR API để tạo mã QR. Payment ở trạng thái PENDING cho đến khi được xác nhận hoặc hết hạn. Ngoài API tra cứu trạng thái, backend còn có webhook `/api/webhooks/payment` để hỗ trợ hoàn thiện luồng xác nhận thanh toán tự động khi tích hợp nguồn callback phù hợp.",
    )

    notif_heading = copy.deepcopy(el_at(body, 130))
    notif_body = copy.deepcopy(el_at(body, 131))
    notif_fig = copy.deepcopy(fig_gallery)
    set_p_text(notif_heading, "7.1.9. Thông báo")
    set_p_text(
        notif_body,
        "Người dùng đã đăng nhập có thể theo dõi thông báo hệ thống ngay trên Navbar thông qua NotificationBell. Danh sách thông báo hỗ trợ polling định kỳ, làm mới thủ công, phân trang, đánh dấu đã đọc và điều hướng nhanh tới đơn hàng hoặc booking liên quan.",
    )
    set_p_text(notif_fig, "Hình 7.1.9. Ảnh chụp thực tế: Thông báo")
    insert_after(body, fig_gallery, notif_fig)
    insert_after(body, fig_gallery, notif_body)
    insert_after(body, fig_gallery, notif_heading)

    admin_insertions = [
        (
            "7.2.7. Quản lý gallery",
            "Admin duyệt/xác nhận ảnh gallery đã upload, cập nhật thông tin hiển thị và xóa khi cần. Luồng upload ảnh sử dụng confirm endpoint để kiểm soát object key và tránh lộ cấu hình storage.",
            "Hình 7.2.7. Ảnh chụp thực tế: Quản lý gallery",
        ),
        (
            "7.2.8. Quản lý người dùng",
            "Admin xem danh sách người dùng, lọc/phân trang, cập nhật role và xóa mềm khi cần. Chức năng này hỗ trợ quản trị quyền truy cập và theo dõi tài khoản trong hệ thống.",
            "Hình 7.2.8. Ảnh chụp thực tế: Quản lý người dùng",
        ),
        (
            "7.2.9. Quản lý đánh giá",
            "Admin xem danh sách review, lọc theo sản phẩm/dịch vụ/barber và xóa các đánh giá không phù hợp. Hệ thống đồng thời hỗ trợ người dùng gửi review cho booking đã hoàn thành và đơn hàng đủ điều kiện.",
            "Hình 7.2.9. Ảnh chụp thực tế: Quản lý đánh giá",
        ),
    ]
    for heading_text, body_text, fig_text in reversed(admin_insertions):
        h = copy.deepcopy(admin_heading_template)
        b = copy.deepcopy(admin_body_template)
        f = copy.deepcopy(admin_fig_template)
        set_p_text(h, heading_text)
        set_p_text(b, body_text)
        set_p_text(f, fig_text)
        idx = list(body).index(api_heading)
        body.insert(idx, f)
        body.insert(idx, b)
        body.insert(idx, h)

    api_rows = api_tbl.findall("w:tr", ns)
    api_desired = [
        [
            "Authentication",
            "POST /auth/register; POST /auth/login; POST /auth/verify-email; POST /auth/resend-verification; POST /auth/forgot-password; POST /auth/reset-password; POST /auth/oauth",
            "Đăng ký, đăng nhập, xác thực OTP email, quên mật khẩu và Google OAuth.",
        ],
        [
            "Barber",
            "GET /api/barbers; GET /api/barbers/page hoặc /paginated; GET /api/barbers/{id}; GET /api/barbers/top; GET /api/barbers/search; POST/PUT/DELETE /api/barbers",
            "Danh sách, tìm kiếm, phân trang và CRUD barber.",
        ],
        [
            "Service",
            "GET /api/services; GET /api/services/page; GET /api/services/{id}; GET /api/services/category/{category}; GET /api/services/search; POST/PUT/DELETE /api/services",
            "Danh sách, lọc, chi tiết và CRUD dịch vụ.",
        ],
        [
            "Product",
            "GET /api/products; GET /api/products/page; GET /api/products/{id}; GET /api/products/category/{category}; GET /api/products/search; POST/PUT/DELETE /api/products",
            "Danh sách, lọc, chi tiết và CRUD sản phẩm.",
        ],
        [
            "Booking",
            "GET /api/bookings; GET /api/bookings/page; GET /api/bookings/my; POST /api/bookings; PATCH /api/bookings/{id}/status; POST /api/bookings/{id}/cancel",
            "Tạo booking, xem danh sách cá nhân/admin, cập nhật trạng thái và hủy booking.",
        ],
        [
            "Order",
            "GET /api/orders; GET /api/orders/page; GET /api/orders/my; GET /api/orders/my/page; POST /api/orders; PATCH /api/orders/{id}/status; POST /api/orders/{id}/confirm-received; POST /api/orders/{id}/cancel",
            "Tạo đơn hàng, lịch sử cá nhân, quản trị trạng thái, xác nhận đã nhận và hủy đơn.",
        ],
        [
            "Payment",
            "POST /api/payments; GET /api/payments/{paymentCode}; GET /api/payments/my-payments; GET /api/payments/my-payments/page; GET /api/payments/page; POST /api/webhooks/payment",
            "Tạo payment VietQR, tra cứu trạng thái, lọc phân trang và nhận webhook thanh toán.",
        ],
        [
            "Review",
            "GET /api/reviews; GET /api/reviews/page; GET /api/reviews/products/{productId}; GET /api/reviews/me; GET /api/reviews/me/reviewable-products; POST /api/reviews; DELETE /api/reviews/{id}",
            "Xem, lọc, tạo và quản lý đánh giá.",
        ],
        [
            "Gallery",
            "GET /api/gallery; GET /api/gallery/page; GET /api/gallery/{id}; POST /api/gallery/confirm; PUT /api/gallery/{id}; DELETE /api/gallery/{id}",
            "Xem, xác nhận upload, cập nhật và xóa ảnh gallery.",
        ],
        [
            "User/Profile",
            "GET/PATCH /api/user/me; PATCH /api/user/me/password; GET /api/user/me/dashboard; GET /api/user/me/orders; GET /api/user/me/bookings; GET/POST/PUT/DELETE/PATCH /api/user/me/addresses/...; POST /api/users/me/avatar/confirm; GET/DELETE /api/users/me/avatar",
            "Hồ sơ cá nhân, dashboard người dùng, lịch sử, địa chỉ giao hàng và avatar.",
        ],
        [
            "Users Admin",
            "GET /api/users; GET /api/users/page; PATCH /api/users/{id}; PATCH /api/users/{id}/role; DELETE /api/users/{id}",
            "Quản lý danh sách người dùng và phân quyền.",
        ],
        [
            "Upload/Storage",
            "POST /api/uploads/presign; POST /api/uploads/image; GET /api/uploads/images/**; GET /api/uploads/minio-legacy/**",
            "Phục vụ luồng upload ảnh và truy cập ảnh qua backend proxy/legacy bridge.",
        ],
        [
            "Notification",
            "GET /api/notifications; GET /api/notifications/unread-count; PATCH /api/notifications/{id}/read; POST /api/notifications/read-all",
            "Danh sách thông báo, số chưa đọc và đánh dấu đã đọc.",
        ],
        [
            "Admin Dashboard",
            "GET /api/admin/dashboard",
            "Thống kê tổng quan cho admin.",
        ],
    ]
    while len(api_rows) - 1 < len(api_desired):
        api_tbl.append(copy.deepcopy(api_rows[-1]))
        api_rows = api_tbl.findall("w:tr", ns)
    while len(api_rows) - 1 > len(api_desired):
        api_tbl.remove(api_rows[-1])
        api_rows = api_tbl.findall("w:tr", ns)
    for row, values in zip(api_rows[1:], api_desired):
        cells = row.findall("w:tc", ns)
        for cell, value in zip(cells[:3], values):
            set_cell_text(cell, value)

    set_p_text(
        el_at(body, 166),
        "Dự án áp dụng kiểm thử ở cả backend và frontend. Backend hiện có các test như AuthServiceTest, BookingServiceTest, TokenRevocationServiceTest, PresignServiceTest, UserProfileServiceTest, UserAddressServiceTest, AdminDashboardServiceTest, OrderControllerTest, ReviewControllerTest và UsersControllerTest. Frontend có các test như booking-policy.test, orders-api.test và notification-i18n.test nhằm kiểm tra quy tắc nghiệp vụ, lớp API client và nội dung thông báo đa ngôn ngữ.",
    )

    test_rows = test_tbl.findall("w:tr", ns)
    test_desired = [
        [
            "Authentication",
            "Kiểm tra đăng ký, đăng nhập, OTP email, Google OAuth, đổi mật khẩu, logout và blacklist token.",
        ],
        [
            "Booking",
            "Kiểm tra tạo booking, chặn trùng slot, hủy trước thời hạn, giới hạn số lần hủy và luồng cập nhật trạng thái.",
        ],
        [
            "Order/Payment",
            "Kiểm tra tạo đơn hàng, sinh payment VietQR, confirm-received, hủy đơn và trạng thái PENDING/PAID/EXPIRED.",
        ],
        [
            "Upload ảnh",
            "Kiểm tra presign/confirm upload avatar, barber, product, gallery và lưu trữ qua MinIO/S3 hoặc backend proxy.",
        ],
        [
            "Dashboard/Users/Reviews",
            "Kiểm tra thống kê dashboard, quản lý người dùng và các nhánh xử lý review ở controller/service.",
        ],
        [
            "Frontend API/i18n",
            "Kiểm tra booking-policy, orders API client và notification localization để giảm lỗi tích hợp UI-API.",
        ],
    ]
    while len(test_rows) - 1 < len(test_desired):
        test_tbl.append(copy.deepcopy(test_rows[-1]))
        test_rows = test_tbl.findall("w:tr", ns)
    while len(test_rows) - 1 > len(test_desired):
        test_tbl.remove(test_rows[-1])
        test_rows = test_tbl.findall("w:tr", ns)
    for row, values in zip(test_rows[1:], test_desired):
        cells = row.findall("w:tc", ns)
        for cell, value in zip(cells[:2], values):
            set_cell_text(cell, value)

    set_p_text(
        el_at(body, 185),
        "Bên cạnh sản phẩm phần mềm, dự án giúp nhóm rèn luyện kỹ năng làm việc nhóm, quản lý nhánh Git, review pull request, xử lý lỗi tích hợp giữa frontend và backend, thiết kế cơ sở dữ liệu quan hệ, xây dựng API và triển khai hệ thống. Một số hướng phát triển tiếp theo gồm hoàn thiện webhook với nguồn callback thanh toán thực tế, quản lý lịch làm việc barber theo ca, báo cáo doanh thu nâng cao, tối ưu trải nghiệm mobile và bổ sung test end-to-end.",
    )

    appendix_rows = appendix_tbl.findall("w:tr", ns)
    last_row = appendix_rows[-1]
    for values in [
        ["21", "Notification bell / danh sách thông báo", "Phạm Quốc Huy"],
        ["22", "Admin Reviews", "Phạm Tiến Đạt"],
    ]:
        row = copy.deepcopy(last_row)
        cells = row.findall("w:tc", ns)
        for cell, value in zip(cells[:3], values):
            set_cell_text(cell, value)
        appendix_tbl.append(row)

    save_doc(src, dst, root)
    print(dst)


if __name__ == "__main__":
    main()
