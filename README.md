# Community-Based Blood Donor Management and Emergency Matching System

A web system for the City Health Office that manages volunteer blood donors, emergency blood requests, and community blood drives. Four user roles work in one system: **City Health Office (CHO) Admin**, **Barangay Health Worker (BHW)**, **Hospital Staff**, and **Volunteer Blood Donor**.

## Features

### Form validation (client side)
- Required fields, formats, and length limits using HTML5 attributes: `required`, `minlength`, `maxlength`, `pattern`, `min`, `max`, `type="email"`, `type="number"`, `type="tel"`, `type="date"`.
- JavaScript validation on input, on blur, and on submit. Invalid forms are never submitted.
- Rules include: names (letters only, at least 2 characters), phone (`+63` prefix that cannot be deleted, then 10 digits), Gmail address (must be unique), strong passwords, unique usernames, quantity 1 to 20, no past dates for new requests and blood drives, donor age 18 to 65.
- Error messages appear under the field. Invalid fields turn red; valid fields turn green.

### Data storage
- Records (donors, emergency requests, blood drives, user accounts, donation responses) are kept in JavaScript arrays and saved in the browser's **Local Storage**.
- Records are loaded again after a page refresh. Passwords are never stored in Local Storage.
- Only records that pass validation are saved.
- The CHO Admin can see a summary of the saved records and reset the sample data in the **Saved Records** box on the dashboard home.

### CRUD (Create, Read, Update, Delete)
| Records | Create | Read | Update | Delete |
|---|---|---|---|---|
| Emergency requests | CHO Admin, Hospital Staff | Table | Edit form | Delete with confirmation |
| Blood drives | CHO Admin, Brgy Health Worker | Table | Edit form | Delete with confirmation |
| Donors | CHO Admin, Brgy Health Worker (Register Donor) | Table | Edit form, Verify, Toggle status | Delete with confirmation |
| User accounts | Created with donors | Table | Edit form | Delete with confirmation (not your own account, not the last admin) |

- Tables and dashboards update immediately using DOM manipulation, without reloading the page.
- Edit forms are filled with the current data and use the same validation rules as the add forms.

### Roles and permissions
| Role | Can do |
|---|---|
| CHO Admin | Everything: donors, requests, matching, blood drives, users, reports, notifications, settings |
| Barangay Health Worker | Register and manage donors, view qualified donors, schedule blood drives |
| Hospital Staff | Add and manage emergency requests, find matching donors, confirm donations |
| Volunteer Blood Donor | View own profile, respond to emergency calls, view the blood drive schedule |

Only **Volunteer Blood Donors** have the **Settings** page, where they can change their username and password (current password, new password, confirm new password). The CHO Admin, Barangay Health Worker, and Hospital Staff do not have Settings. Donors can only be registered by the CHO Admin or a Barangay Health Worker (there is no self sign-up).

## Technologies
HTML5, CSS3, JavaScript (no framework), PHP, MySQL, XAMPP (Apache + MySQL).

## Project structure
```
blood_donor_system/
├── index.html            Main page (login, dashboards, forms, tables, modals)
├── css/style.css         Styling
├── js/script.js          Validation, storage, CRUD, role rules
├── login.php             Login and preset accounts
├── register_account.php  Donor registration
├── account_settings.php  Change username / password
├── config/db.php         Database connection
└── README.md
```

## How to run
1. Install and start **XAMPP** (Apache and MySQL).
2. Copy the project folder to `C:\xampp\htdocs\blood_donor_system\`.
3. Open phpMyAdmin (`http://localhost/phpmyadmin`), create the database `blood_donor_db`, and import the `.sql` file included in this repository.
4. Check the connection settings in `config/db.php` (host `localhost`, user `root`, database `blood_donor_db`).
5. Open `http://localhost/blood_donor_system/` in your browser.

## Preset accounts (for local testing only)
| Role | Username | Password |
|---|---|---|
| CHO Admin | `choadmin` | `ChoAdmin123!` |
| Barangay Health Worker | `bhwgensan` | `BhwGensan123!` |
| Hospital Staff | `hospitalstaff` | `Hospital123!` |

Change these passwords before using the system anywhere other than a local computer.

## How to test
1. **Validation:** leave a form empty, or type a wrong phone number, a non-Gmail address, or a quantity of 99. Red messages appear and the form is not submitted.
2. **Storage:** add an emergency request, then press F5 and log in again. The record is still in the table. Open the browser tools (Ctrl + Shift + I) > Application > Local Storage to see the key `bloodDonorSystemRecords_v1`.
3. **Edit:** click **Edit** on any row, change a value, and save. The table updates immediately.
4. **Delete:** click **Delete**, read the confirmation window, and confirm. The row disappears from the table and from Local Storage.

## Notes
- Records shown in the tables are stored in the browser (Local Storage). Login accounts are checked against the MySQL database.
- Deleting a record in the tables removes it from the browser storage only; it does not delete rows from the MySQL database.

## Author
Name: _add your name_
Course / Section: _add your course and section_
