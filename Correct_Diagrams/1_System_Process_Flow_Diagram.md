# 1. System Process Flow Diagram

[Back to the list of diagrams](../Correct_Diagrams.md)

> **Updated November 17, 2026** to match the system as built: no login PIN, body type and face consent at registration, manual check-in, repetition counting, renewals, the Price list, and four report types.

## 1.1 Login and navigation

```mermaid
flowchart TD
    Start([Start]) --> Login["Open login page"]
    Login --> Cred["Enter email and password"]
    Cred --> Valid{"Email and password<br/>correct?"}
    Valid -- No --> Err1["Show login error"]
    Err1 --> Cred
    Valid -- Yes --> Dash["Overview (dashboard)"]

    Login -. "Forgot password" .-> Reset["Enter email, enter the PIN sent by email,<br/>then set a new password"]
    Reset --> Login

    Dash --> Select["Select function"]
    Select --> M1["Member Registration"]
    Select --> M2["Packages"]
    Select --> M3["Transactions"]
    Select --> M4["Reports"]
    Select --> M5["Attendance Monitor"]
    Select --> M6["Gesture Monitor"]
    Select --> M7["Admin Profile"]

    M1 --> Out{"Log out?"}
    M2 --> Out
    M3 --> Out
    M4 --> Out
    M5 --> Out
    M6 --> Out
    M7 --> Out
    Out -- No --> Dash
    Out -- Yes --> Logout["Log out (session token deleted)"]
    Logout --> End([End])
```

## 1.2 Member registration

```mermaid
flowchart TD
    A([Start]) --> B["Open Member Registration<br/>and click Register a member"]
    B --> C["Add a profile photo (optional)"]
    C --> D["Member agrees to face enrollment<br/>(consent box ticked)"]
    D --> E["Capture face: front, chin down,<br/>left side and right side"]
    E --> F{"All four face<br/>views captured?"}
    F -- No --> G["Show 'Face Capture Required'"]
    G --> E
    F -- Yes --> H["Enter first name, last name, email, phone and address;<br/>optional date of birth, height, weight and body type"]
    H --> I["Click Save"]
    I --> J{"Details valid, email not already used<br/>and consent given?"}
    J -- No --> K["Show validation error"]
    K --> H
    J -- Yes --> L["Save member record, face photo<br/>and the date of consent"]
    L --> M["Gesture Engine reloads the enrolled faces<br/>(within a minute)"]
    M --> N([End])
```

## 1.3 Attendance monitoring

```mermaid
flowchart TD
    A([Start]) --> B["Camera sends live video<br/>to the Gesture Engine"]
    B --> C["Detect faces in the frame"]
    C --> D["Compare each face with<br/>the enrolled member photos"]
    D --> E{"Face matches a member<br/>in several agreeing checks?"}
    E -- No --> F["Show red box labelled 'Unknown'<br/>on the live feed"]
    F --> F2{"Admin checks the member<br/>in manually?"}
    F2 -- No --> Z([End])
    F2 -- Yes --> F3["Admin selects the member<br/>and types a reason"]
    F3 --> I
    E -- Yes --> G["Show green box with the member's name<br/>(orange 'RENEW' if the subscription expired)"]
    G --> H["Send member ID to the Laravel API"]
    H --> I{"Time is between<br/>9:00 AM and 9:30 PM?"}
    I -- No --> X["No attendance saved"]
    I -- Yes --> J{"Member already<br/>logged today?"}
    J -- Yes --> X
    X --> Z
    J -- No --> K["Save attendance: member, date, time in, method,<br/>camera and subscription status"]
    K --> K2{"Member profile<br/>Inactive?"}
    K2 -- Yes --> K3["Set member back to Active"]
    K2 -- No --> L
    K3 --> L["Check-in appears in the<br/>Attendance Monitor list"]
    L --> Z
```

## 1.4 Program monitoring

```mermaid
flowchart TD
    A([Start]) --> B["Open the member's Training plan"]
    B --> C["Build the 7-day plan:<br/>exercise, date, sets and reps"]
    C --> D["Save plan<br/>(tasks stored as pending)"]
    D --> E{"Can the camera<br/>recognize this exercise?"}
    E -- No --> M["Coach verifies the task manually"]
    E -- Yes --> F["Member performs the exercise<br/>in camera view"]
    F --> G["Gesture Engine recognizes the member's face<br/>and detects the body pose"]
    G --> H{"Member has an active<br/>With Coach subscription?"}
    H -- No --> N["Feed shows a grey tag:<br/>'name - no coach plan'"]
    N --> M
    H -- Yes --> I["Classify the exercise<br/>from the body pose"]
    I --> J{"Assigned exercise seen in 5 of the<br/>last 7 predictions, at 70% confidence or more?"}
    J -- No --> F
    J -- Yes --> K{"More than one pending task<br/>matches this exercise?"}
    K -- Yes --> M
    K -- No --> P{"Counted exercise?<br/>(squat, push-up, curl, sit-up)"}
    P -- No --> L["Task marked as verified by the camera"]
    P -- Yes --> Q["Count repetitions from the joint angle<br/>and save the progress every few seconds"]
    Q --> R{"Target sets x reps<br/>reached?"}
    R -- No --> Q
    R -- Yes --> L
    M --> L2["Task marked as verified by the coach"]
    L --> O["Result appears in the Gesture Monitor,<br/>the member's workout history and the Program Monitoring report"]
    L2 --> O
    O --> Z([End])
```

## 1.5 Packages and subscriptions

```mermaid
flowchart TD
    A([Start]) --> B["Open Packages<br/>(Subscriptions, Calendar or Price list)"]
    B --> C{"What does the<br/>admin want to do?"}

    C -- "Price list" --> D["Create or edit a package:<br/>name, category, days, price and color"]
    D --> D2["Package saved"]
    D2 --> Z([End])
    C -- "Delete a package" --> D3{"Members still subscribed<br/>to the package?"}
    D3 -- Yes --> D4["Delete refused,<br/>the message says how many members"]
    D4 --> Z
    D3 -- No --> D5["Package deleted<br/>(ended subscriptions keep its name)"]
    D5 --> Z

    C -- "Subscribe a member" --> E["Select member, package,<br/>start date and payment method"]
    E --> F{"Member already has an<br/>active subscription?"}
    F -- Yes --> G["Show error:<br/>upgrade the existing subscription instead"]
    G --> Z
    F -- No --> H["Save subscription<br/>(end date = start date + package duration)"]
    H --> I["Create the payment transaction automatically"]
    I --> J["Set the member's plan and status to Active"]
    J --> Z

    C -- "Renew" --> R1{"Subscription still<br/>running?"}
    R1 -- Yes --> R2["Extend the same package from its end date<br/>(no paid days lost)"]
    R1 -- No --> R3["Start a new subscription today"]
    R2 --> R4["Create a renewal payment transaction"]
    R3 --> R4
    R4 --> Z

    C -- "Upgrade subscription" --> K["Select a new package"]
    K --> L{"New package has<br/>a higher price?"}
    L -- No --> P["Show error:<br/>choose a higher-priced package"]
    P --> Z
    L -- Yes --> N["Update subscription with the<br/>new package and new dates"]
    N --> O["Create an upgrade transaction for the balance<br/>(new price minus amount already paid)"]
    O --> Z

    C -- "Classes and events" --> Q["Add, edit or delete a calendar event"]
    Q --> Z
```

## 1.6 Payment transactions

```mermaid
flowchart TD
    A([Start]) --> B["Open Transactions"]
    B --> C{"What does the<br/>admin want to do?"}

    C -- "Record payment" --> D["Select the package, and the member<br/>(a walk-in guest needs no member)"]
    D --> E["Enter amount, payment method<br/>(Cash, GCash or Maya) and reference number"]
    E --> F["Save transaction with a TXN number"]
    F --> G{"Print receipt?"}
    G -- Yes --> H["Print receipt"]
    H --> Z([End])
    G -- No --> Z

    C -- "Refund" --> I["Select a transaction"]
    I --> J{"Completed, positive amount<br/>and not already a refund?"}
    J -- No --> K["Show error"]
    K --> Z
    J -- Yes --> L["Create a negative refund transaction"]
    L --> M["Mark the original transaction as Refunded"]
    M --> Z

    C -- "Export" --> N["Download CSV or print<br/>the transaction list"]
    N --> Z
```

## 1.7 Reports

```mermaid
flowchart TD
    A([Start]) --> B["Open Reports"]
    B --> C["Choose report type: Payments, Memberships,<br/>Attendance or Program Monitoring"]
    C --> D["Set start date and end date"]
    D --> E["System loads the records for that period"]
    E --> F["Show summary figures and the report table"]
    F --> G{"Export?"}
    G -- CSV --> H["Download CSV file"]
    G -- Print --> I["Open the browser print dialog"]
    G -- No --> Z([End])
    H --> Z
    I --> Z
```
