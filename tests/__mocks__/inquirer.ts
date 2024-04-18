// const inquirer = jest.createMockFromModule("inquirer") as any;

// let mockAnswers: Record<string, any> = {};
// inquirer.__setMockAnswers = (newAnswers: Record<string, any>) => {
//   mockAnswers = newAnswers;
// };

// inquirer.prompt = jest.fn(questions => {
//   return Promise.resolve(
//     questions.reduce((answers: any, question: any) => {
//       answers[question.name] = mockAnswers[question.name];
//       return answers;
//     }, {}),
//   );
// });

// export default inquirer;
