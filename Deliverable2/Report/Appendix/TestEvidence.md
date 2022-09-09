# Test Evidence Catalog

- normal cases.

| Feature | Test | Result | Evidence |
| ------- | --------------------------- | ---- | ------------- |
| Sign-up | Can the use be registered | Pass | Slide 2 and 3 |
| Login-in | Valid Username and Password logs user in | Pass | Slide 25 and 26 |
| Login-in | Invalid Username and Password fails login | Pass | Slide 27 |
| Posting | Posting Text file(.txt) | Pass | Slide 36-38 |
| Posting | Posting JavaScript file(.js) | Pass | Slide 39-41 |
| Posting | Posting Zip file(.zip) | Partial | Slide 42-44 |
| Comment | Allows to comment on a file | Pass | Slide 55 |
| Comment | more than 1 comment on a file | Pass | Slide 56 |

- boundary cases.
| Feature | Test | Result | Evidence |
| --- | --- | --- | --- |
| Sign-up | Creating Password with no Upper case letters | Pass | Slide 4 |
| Sign-up | Creating Password with Special Characters | Pass | Slide 5 and 6 |
| Sign-up | Mismatching passwords | Pass | Slide 7 |
| Sign-up | Creating Password less than 8 charaters | Pass | Slide 8 |
| Sign-up | Phone number with a letter | Pass | Slide 9 |
| Sign-up | Phone number less than 5 charaters | Pass | Slide 10 |
| Sign-up | Phone number more than 5 charaters | Pass | Slide 11 |
| Sign-up | Phone number with a special chars (+) | Pass | Slide 12-13 |
| Sign-up | Mismatching passwords | Pass | Slide 7 |
| Sign-up | Creating Password less than 8 charaters | Pass | Slide 8 |
| Sign-up | Mismatching passwords | Pass | Slide 7 |
| Sign-up | Creating Password less than 8 charaters | Pass | Slide 8 |
| Sign-up | Email less than 5 chars long | Pass | Slide 22 |
| Sign-up | Email more then 96 chars | Pass | Slide 23 |
| Login-in | Username without ':' | Pass | Slide 28 |
| Login-in | Username without 't03' | Pass | Slide 29 |
| Login-in | Username syntax invalid | Pass | Slide 31 |
| Login-in | Username invalid | Pass | Slide 32 |
| Login-in | password is less than 8 chars | Pass | Slide 30 |
| Posting | Posting empty Text file(.txt) | Pass | Slide 45-46 |
| Posting | title and discription containing space charater | Pass | Slide 47 |
| Posting | title and discription containing special charater | Pass | Slide 48 |
| Comment | Comments with special characters | Pass | Slide 57 |
| Comment | comments with space character and numbers | Pass | Slide 58 |

- extreme cases.
| Feature | Test | Result | Evidence |
| --- | --- | --- | --- |
| Sign-up | Phone number with just letter | Pass | Slide 15 |
| Sign-up | Phone number with no input | Pass | Slide 14 |
| Sign-up | Multiple Sig-ups with the same email | Pass | Slide 16 |
| Sign-up | email with a space character | Pass | Slide 17 |
| Sign-up | email with just special characters | Pass | Slide 18 |
| Sign-up | empty email input | Pass | Slide 19 |
| Sign-up | email with no '.' | Pass | Slide 20 |
| Sign-up | email with nothing after '@' | Pass | Slide 21 |
| Login-in | No input for password | Pass | Slide 33 |
| Login-in | No input for Username | Pass | Slide 34 |
| Posting | empty title | Pass | Slide 49 |
| Posting | empty Discription | Pass | Slide 50 |
| Posting | no file chosen | Pass | Slide 51 |
| Posting | title longer than 40 chars | Pass | Slide 52 |
| Posting | Discription longer than 200 chars | Pass | Slide 53 |
| Comment | empty comments | Pass | Slide 59 |
| Comment | comments longer than 100 chars | Pass | Slide 60 |
| Comment | comments shorter than 10 chars | Pass | Slide 61 |

See evidences `./TestingEvidences.pdf`.
