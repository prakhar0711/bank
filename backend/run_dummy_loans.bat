@echo off
echo Running dummy loans SQL script...
mysql -u root -p bank_management < database/dummy_loans.sql
echo Done!
pause 