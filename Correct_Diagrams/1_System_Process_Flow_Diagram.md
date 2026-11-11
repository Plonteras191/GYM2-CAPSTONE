# 1. System Process Flow Diagram

[Back to the list of diagrams](../Correct_Diagrams.md)

## 1.1 Login and navigation

```mermaid
flowchart TD
    Start([Start]) --> Login["Open login page"]
    Login --> Cred["Enter email and password"]
    Cred --> Valid{"Email and password<br/>correct?"}
    Valid -- No --> Err1["Show login error"]
    Err1 --> Cred
    Valid -- Yes --> Pin["System creates a 6-digit PIN<br/>(sent by email or shown on screen)"]
    Pin --> EnterPin["Enter PIN"]
    EnterPin --> PinOk{"PIN correct and<br/>not expired?"}
    PinOk -- No --> Err2["Show PIN error<br/>(after 5 wrong tries or 10 minutes, sign in again)"]
    Err2 --> EnterPin
    PinOk -- Yes --> Dash["Overview (dashboard)"]

    Login -. "Forgot password" .-> Reset["Enter email, enter the reset PIN,<br/>then set a new password"]
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
    A([Start]) --> B["Open Member Registration<br/>and click Add Member"]
    B --> C["Enter first name, last name, email, phone,<br/>address, date of birth, height and weight"]
    C --> D["Capture face: front, left side and right side"]
    D --> E{"All three face<br/>views captured?"}
    E -- No --> F["Show 'Face Capture Required'"]
    F --> D
    E -- Yes --> G["Click Save"]
    G --> H{"Details valid and<br/>email not already used?"}
    H -- No --> I["Show validation error"]
    I --> C
    H -- Yes --> J["Save member record and face photo"]
    J --> K["Gesture Engine reloads the enrolled faces"]
    K --> L([End])
```

## 1.3 Attendance monitoring (automatic)

```mermaid
flowchart TD
    A([Start]) --> B["Camera sends live video<br/>to the Gesture Engine"]
    B --> C["Detect faces in the frame"]
    C --> D["Compare each face with<br/>the enrolled member photos"]
    D --> E{"Face matches<br/>a member?"}
    E -- No --> F["Show red box labelled 'Unknown'<br/>on the live feed"]
    F --> Z([End])
    E -- Yes --> G["Show green box with the member's name<br/>on the live feed"]
    G --> H["Send member ID to the Laravel API"]
    H --> I{"Time is between<br/>9:00 AM and 9:30 PM?"}
    I -- No --> X["No attendance saved"]
    I -- Yes --> J{"Member already<br/>logged today?"}
    J -- Yes --> X
    X --> Z
    J -- No --> K["Save attendance:<br/>member, date and time in"]
    K --> L["Check-in appears in the<br/>Attendance Monitor list"]
    L --> Z
```

## 1.4 Program monitoring

```mermaid
flowchart TD
    A([Start]) --> B["Coach opens the member's profile"]
    B --> C["Build the 7-day workout plan:<br/>exercise, date, sets and reps"]
    C --> D["Save plan<br/>(tasks stored as pending)"]
    D --> E{"Can the camera<br/>recognize this exercise?"}
    E -- No --> M["Coach verifies the task manually"]
    E -- Yes --> F["Member performs the exercise<br/>in camera view"]
    F --> G["Gesture Engine recognizes the member's face<br/>and detects the body pose"]
    G --> H{"Member has an active<br/>With Coach subscription?"}
    H -- No --> N["Feed shows<br/>'COACH MEMBERSHIP REQUIRED'"]
    N --> M
    H -- Yes --> I["Classify the exercise<br/>from the body pose"]
    I --> J{"Assigned exercise seen in 5 of the<br/>last 7 predictions, at 70% confidence or more?"}
    J -- No --> F
    J -- Yes --> K{"More than one pending task<br/>matches this exercise?"}
    K -- Yes --> M
    K -- No --> L["Task marked as verified"]
    M --> L
    L --> O["Result appears in the Gesture Monitor<br/>and the member's workout history"]
    O --> Z([End])
```

## 1.5 Packages and subscriptions

```mermaid
flowchart TD
    A([Start]) --> B["Open Packages"]
    B --> C{"What does the<br/>admin want to do?"}

    C -- "Manage packages" --> D["Add, edit or delete a package:<br/>name, price, duration, category and color"]
    D --> Z([End])

    C -- "New subscription" --> E["Select member, package,<br/>start date and payment method"]
    E --> F{"Member already has an<br/>active subscription?"}
    F -- Yes --> G["Show error:<br/>upgrade the existing subscription instead"]
    G --> Z
    F -- No --> H["Save subscription<br/>(end date = start date + package duration)"]
    H --> I["Create the payment transaction automatically"]
    I --> J["Set the member's plan and status to Active"]
    J --> Z

    C -- "Upgrade subscription" --> K["Select a new package"]
    K --> L{"New package has<br/>a higher price?"}
    L -- No --> P["Show error:<br/>choose a higher-priced package"]
    P --> Z
    L -- Yes --> N["Update subscription with the<br/>new package and new dates"]
    N --> O["Create an upgrade transaction for the balance<br/>(new price minus amount already paid)"]
    O --> Z

    C -- "Coach events" --> Q["Add, edit or delete a calendar event"]
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
    B --> C["Choose report type:<br/>Payment Transactions, or<br/>Membership and Attendance Status"]
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
