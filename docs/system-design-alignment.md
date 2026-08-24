# System Design Alignment

The attached v1.0 solution document proposed a Notion weekly page. Internship discovery found that the current HR workflow uses Excel and that introducing another tool would add burden. This branch therefore preserves the detection concept while changing the delivery surface to Excel.

| Requirement or discovery | Concept prototype | Work required after permission |
| --- | --- | --- |
| Company permission before access | Shown as Step 0 and a clear UI boundary | Approve departments, scope, retention, anonymization, and HR access |
| Backlog issue as anchor | Implemented with fictional issue records | Replace demo adapter with approved read-only Backlog connector |
| Weekly automatic collection | Demonstrated as one-click weekly batch | Schedule approved connectors |
| Chatwork input | Fictional Chatwork records | Approved read-only Chatwork connector |
| Meeting-record input | Fictional meeting decisions | Approved internal records connector |
| Rework counter without LLM | Implemented deterministically | Calibrate event definition and threshold |
| Contradiction detection | Local Ollama NLI plus deterministic fallback | Evaluate precision and tune prompt/model |
| Off-record reference detection | Implemented with Japanese/English patterns | Expand patterns and measure false positives |
| Cross-channel consistency | Implemented in fictional examples | Validate issue-to-meeting linkage |
| HR-only output | Implemented as a concept | Add authentication, storage, and access control |
| Existing Excel workflow | Excel-style workbook with summary, candidates, interview notes, and false-positive tabs | Generate an approved workbook and store it in the location HR already uses |
| False-positive logging | Interactive session state | Persistent approved storage |
| Names replaced with roles | Fictional records use roles only | Anonymize at retrieval |
| Zero frontline operation | No employee/manager interface | Confirm operational acceptance |
| No emotion or individual scoring | Implemented | Preserve in governance policy |
| Interview-question package | Implemented | Validate usefulness with HR |

## Internship boundary

Real connector testing is outside the remaining internship schedule. The prototype demonstrates the proposed experience and logic only. A later pilot should begin with one approved department, read-only permissions, a short retention period, and an explicit stop/review decision before expansion.

