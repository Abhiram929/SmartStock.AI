# SmartStock AI: Use Case Diagram

This diagram illustrates the interactions between the Small Business Owner, the Antigravity Orchestration Layer, and the Gemma AI Intelligence tier.

```mermaid
useCaseDiagram
    actor "Small Business Owner" as user
    
    package "SmartStock AI System" {
        usecase "Add Inventory Item" as UC1
        usecase "Run AI Stock Prediction" as UC2
        usecase "View Business Analytics" as UC3
        usecase "Export Prediction Report" as UC4
        usecase "View System Architecture" as UC5
    }
    
    package "Antigravity Framework (Layer 2)" {
        usecase "Clean & Format Data" as UC6
        usecase "Route API Requests" as UC7
    }
    
    actor "Gemma AI (Layer 1)" as ai
    
    user --> UC1
    user --> UC2
    user --> UC3
    user --> UC4
    user --> UC5
    
    UC2 ..> UC6 : <<include>>
    UC2 ..> UC7 : <<include>>
    
    UC7 --> ai : "Request Inference"
    ai --> UC7 : "Stream Response"
```

## How to use this for your presentation:
1.  **Copy the diagram above.**
2.  You can paste this Mermaid code into [Mermaid Live Editor](https://mermaid.live/) to download it as a high-quality **PNG** or **SVG** for your slides.
3.  I have also saved a copy of this file as `use_case_diagram.md` in your project folder.
