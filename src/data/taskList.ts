export interface TaskInfo {
  short: string;
  full: string;
}

export const TASK_LIST_DESCRIPTIONS: Record<string, TaskInfo> = {
  'A-1': { short: 'Data Collection Prep', full: 'Prepare for data collection.' },
  'A-2': { short: 'Continuous Measurement', full: 'Implement continuous measurement procedures (e.g., frequency, duration).' },
  'A-3': { short: 'Discontinuous Measurement', full: 'Implement discontinuous measurement procedures (e.g., partial interval, whole interval, momentary time sampling).' },
  'A-4': { short: 'Permanent Product', full: 'Implement permanent-product recording procedures.' },
  'A-5': { short: 'Data Entry & Graphing', full: 'Enter data and update graphs.' },
  'B-1': { short: 'Preference Assessments', full: 'Conduct preference assessments.' },
  'B-2': { short: 'Individualized Assessments', full: 'Assist with individualized assessment procedures (e.g., social skills).' },
  'B-3': { short: 'Functional Assessments', full: 'Assist with functional assessment procedures.' },
  'C-1': { short: 'Skill Acquisition Plans', full: 'Identify essential components of a written skill acquisition plan.' },
  'C-2': { short: 'Session Preparation', full: 'Prepare for the session as required by the skill acquisition plan.' },
  'C-3': { short: 'Reinforcement Contingencies', full: 'Use contingencies of reinforcement.' },
  'C-4': { short: 'Discrete-Trial Teaching', full: 'Implement discrete-trial teaching procedures.' },
  'C-5': { short: 'Naturalistic Teaching', full: 'Implement naturalistic teaching procedures (e.g., incidental teaching).' },
  'C-6': { short: 'Task Chaining', full: 'Implement task analyzed chaining procedures.' },
  'C-7': { short: 'Discrimination Training', full: 'Implement discrimination training.' },
  'C-8': { short: 'Stimulus Transfer', full: 'Implement stimulus control transfer procedures.' },
  'D-1': { short: 'Behavior Reduction Plans', full: 'Identify components of a written behavior reduction plan.' },
  'D-2': { short: 'Common Functions', full: 'Describe common functions of behavior.' },
  'D-3': { short: 'Antecedent Interventions', full: 'Implement antecedent interventions (MOs and SDs).' },
  'D-4': { short: 'Differential Reinforcement', full: 'Implement differential reinforcement procedures (e.g., DRA, DRO).' },
  'D-5': { short: 'Extinction Procedures', full: 'Implement extinction procedures.' },
  'D-6': { short: 'Crisis Procedures', full: 'Implement crisis/emergency procedures according to protocol.' },
  'E-1': { short: 'Supervisor Communication', full: 'Effectively communicate with a supervisor in an ongoing manner.' },
  'E-2': { short: 'Seeking Direction', full: 'Actively seek clinical direction from supervisor.' },
  'E-3': { short: 'Variable Reporting', full: 'Report other variables that might affect the client.' },
  'E-4': { short: 'Session Notes', full: 'Generate objective session notes in accordance with requirements.' },
  'E-5': { short: 'Compliance Requirements', full: 'Comply with legal, regulatory, and workplace requirements.' },
  'F-1': { short: 'Supervision Requirements', full: 'Describe the BACB’s supervision requirements for RBTs.' },
  'F-2': { short: 'Receiving Feedback', full: 'Respond appropriately to feedback and maintain performance.' },
  'F-3': { short: 'Stakeholder Communication', full: 'Communicate with stakeholders as authorized.' },
  'F-4': { short: 'Professional Boundaries', full: 'Maintain professional boundaries.' },
  'F-5': { short: 'Client Dignity', full: 'Maintain client dignity.' },
};

export const TASK_LIST_AREAS = [
  { id: 'A', name: 'Measurement', items: ['A-1', 'A-2', 'A-3', 'A-4', 'A-5'] },
  { id: 'B', name: 'Assessment', items: ['B-1', 'B-2', 'B-3'] },
  { id: 'C', name: ' Skill Acquisition', items: ['C-1', 'C-2', 'C-3', 'C-4', 'C-5', 'C-6', 'C-7', 'C-8'] },
  { id: 'D', name: 'Behavior Reduction', items: ['D-1', 'D-2', 'D-3', 'D-4', 'D-5', 'D-6'] },
  { id: 'E', name: 'Documentation', items: ['E-1', 'E-2', 'E-3', 'E-4', 'E-5'] },
  { id: 'F', name: 'Professional Conduct', items: ['F-1', 'F-2', 'F-3', 'F-4', 'F-5'] },
];
