# What is this?
this is the system design before implementing.
the design consist sequence-diagram designing of each entity and api how it handle the request and returning the error by using Mermaid.js but some design is using plantUML which I knew it after knowing Mermaid. which is better than Mermaid

# How to modify the diagram?
1. clone this repository to your local repository.
2. install extensions below
3. that's it. you can modify these diagrams.

### extension links
- [Mermaid Editor](https://marketplace.visualstudio.com/items?itemName=tomoyukim.vscode-mermaid-editor) - to preview the diagram in the editor
- [Mermaid Markdown Syntax Highlighting](https://marketplace.visualstudio.com/items?itemName=bpruitt-goddard.mermaid-markdown-syntax-highlighting) *(optional)* - to highlight the syntax if you want to modify the diagram.
- [Live Share](https://marketplace.visualstudio.com/items?itemName=MS-vsliveshare.vsliveshare) - to edit code together in realtime
- [PlantUML](https://marketplace.visualstudio.com/items?itemName=jebbs.plantuml) - to preview the `.puml` file (if need)

# to preview the diagram?
### Mermaid(.mmd)
- Method1: run the file `../design/diagram_preview.html` with live server extension
- Method2: open the diagram code and click the eye icon on top right
#### PlantUML (.puml)
- open the diagram and press `alt+D`

# to examine the sample Dataset
run the file `../design/json_grid_visualizer.html` with live server extension



# Diagrams status
| Diagram Name                            | finish | verify |
|-----------------------------------------|--------|--------|
| 0. SoftwareArchitectureDiagram.mmd      |   [x]  |   [x]  |
| 1. GeneralClassTemplate.mmd             |   [x]  |   [x]  |
**----------------Classes----------------**
| 2. SecurityManagement                   |   [ ]  |   [ ]  |
| 3. UserManagement                       |   [x]  |   [x]  |
| 5. BankAccountManagement                |   [ ]  |   [ ]  |
| 6. IncomeExpenseTransactionsManagement  |   [ ]  |   [ ]  |
| 7. BankAccountTransactionsManagement    |   [ ]  |   [ ]  |
| 8. DebtsManagement                      |   [ ]  |   [ ]  |
| 9. SettingManagement                    |   [ ]  |   [ ]  |
| 10. NotificationsManagement             |   [ ]  |   [ ]  |
**------------------Api------------------**
| 4. EasySlip.mmd                         |   [ ]  |   [ ]  |


