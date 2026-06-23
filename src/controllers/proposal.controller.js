import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const generateProposal = async (req, res) => {
  try {
    const {
      projectGoal,
      expertiseNeeded,
      budget,
      description
    } = req.body;

    const prompt = `
Generate a professional software project proposal.

Include:

1. Executive Summary
2. Recommended Tech Stack
3. Development Milestones
4. Deliverables per Milestone
5. Estimated Timeline
6. Future Scalability Goals

Project Goal: ${projectGoal}

Expertise Needed: ${expertiseNeeded}

Budget: ${budget}

Description: ${description}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    });

    return res.json({
      success: true,
      proposal: completion.choices[0].message.content
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};