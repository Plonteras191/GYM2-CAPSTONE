1. CCTV_URL = 'rtsp://admin:Jheval07012004@192.168.1.45:554/Streaming/Channels/102'
    - This 192.168.1.45:554 will depend on your wifi IP when the UTP cable is connected to it
    - Must double check this before presenting



2. Core Sections of a PRD
    1. Metadata and Overview: Lists the document title, owner, core team members, status, and target release date.
    
    2. Background and Problem Statement: Explains the user or business context, detailing the exact problem you are solving and who faces it.
    
    3. Goals and Objectives: Outlines the strategic purpose and specific targets the feature aims to hit.
    
    4. Scope (In-Scope and Out-of-Scope): Clarifies what features are included now and what is intentionally left out for future updates.
    
    5. Target Audience and User Stories: Defines user personas, critical user journeys, and specific user stories with acceptance criteria.
    
    6. Functional and Non-Functional Requirements: Details what the system must do functionally, alongside performance, security, and scalability standards.
    
    7. Design and User Experience (UX): Links wireframes, mockups, or user flow diagrams to show interface expectations.
    
    8. Assumptions, Constraints, and Dependencies: Identifies outside technical limits, third-party API dependencies, or budget limits.
    
    9. Success Metrics: Defines the Key Performance Indicators (KPIs) used to measure if the release succeeds.



3. Coloring
    **Buttons**
        Yellow400(left) --> Amber500(right)
    **Buttons Secondary**
        Black(LightMode) --> Gray300(Lightmode)
    **Buttons < >**
        Lightmode - Gray-200 (Text Color Black)
        Darkmode - Gray-600 (Text Color Gray-300)
    **Text Buttons**
        Black (Lightmode) --> Gray300(DarkMode)
   
4. Font
    **Buttons**
        -San Serif, 15px, text-normal, bold

5. Margin and Padding
    **Buttons***
        Margin: 0 4px (0px vertical, 4px on each side)
        Padding: 8px 14px (8px vertical, 14px horizontal)
        Minimum height: 38px
    **Buttons < >**
        Margin: 0 4px
        Padding: .4em .65em, about 6px vertical/ 9.75px horizontal at 15px text
        Minimum height: None but fixed at 32 x 32px

6. Corner Radius 
    **Buttons**
         8px corner radius (0.5rem, equivalent to Tailwind’s rounded-lg).
    **Buttons < >**

7. Transparency
    **Buttons**
        -Normal = 1
        -Transparent = 0.5

8. Separator
    Lightmode - gray-300
    Darkmode - gray-600