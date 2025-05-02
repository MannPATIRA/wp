import { db } from '../server/db.ts';
import { opportunities } from '../shared/schema.ts';

async function addSampleOpportunities() {
  console.log("Adding sample opportunities to the database...");

  // Check if any opportunities already exist
  const existingOpportunities = await db.select().from(opportunities);

  if (existingOpportunities.length > 0) {
    console.log(`Database already has ${existingOpportunities.length} opportunities.`);
    return;
  }

  // Sample opportunities
  const sampleOpportunities = [
    {
      title: "MIT Summer Research Program in Computer Science",
      description: "A six-week intensive research experience for undergraduate students interested in computer science.",
      category: "Research",
      tags: ["Computer Science", "Research", "Summer Program"],
      programDates: "June 15 - July 31, 2025",
      applicationDeadline: new Date("2025-02-15"),
      location: "Cambridge, MA",
      eligibility: "High school students with strong interest in computer science",
      cost: "$2,500",
      financialAidAvailable: true,
      organizationName: "Massachusetts Institute of Technology",
      contactEmail: "mitcsrp@example.mit.edu",
      externalLink: "https://example.mit.edu/summer-research",
      impactRating: 5,
      benefits: [
        "Work with world-class researchers",
        "Gain hands-on research experience",
        "Strengthen college applications",
        "Network with MIT faculty and students"
      ],
      isVerified: true
    },
    {
      title: "Imperial College London Computer Science Masterclass",
      description: "A specialized two-week program for students interested in advanced computer science topics.",
      category: "Academic",
      tags: ["Computer Science", "Masterclass", "International"],
      programDates: "July 1 - July 14, 2025",
      applicationDeadline: new Date("2025-03-01"),
      location: "London, UK",
      eligibility: "High school students in final two years of secondary education",
      cost: "£1,200",
      financialAidAvailable: true,
      organizationName: "Imperial College London",
      contactEmail: "cs-masterclass@example.imperial.ac.uk",
      externalLink: "https://example.imperial.ac.uk/cs-masterclass",
      impactRating: 5,
      benefits: [
        "Learn from Imperial College professors",
        "Explore advanced CS topics",
        "Strengthen applications to UK universities",
        "Experience university life in London"
      ],
      isVerified: true
    },
    {
      title: "National High School Coding Competition",
      description: "Annual competition challenging high school students to solve complex programming problems.",
      category: "Competition",
      tags: ["Coding", "Competition", "Problem Solving"],
      programDates: "Preliminary Round: March 2025, Finals: May 2025",
      applicationDeadline: new Date("2025-02-28"),
      location: "Online (Preliminary), New York, NY (Finals)",
      eligibility: "High school students with programming experience",
      cost: "$25 registration fee",
      financialAidAvailable: true,
      organizationName: "National Computing Association",
      contactEmail: "coding-comp@example.org",
      externalLink: "https://example.org/high-school-coding-competition",
      impactRating: 4,
      benefits: [
        "Demonstrate problem-solving skills",
        "Win scholarships and prizes",
        "Gain recognition for college applications",
        "Compete with talented peers nationally"
      ],
      isVerified: true
    },
    {
      title: "AI for Social Good Summer Camp",
      description: "Learn how to apply artificial intelligence techniques to address social challenges.",
      category: "Summer Program",
      tags: ["AI", "Social Impact", "Technology"],
      programDates: "June 20 - July 10, 2025",
      applicationDeadline: new Date("2025-03-15"),
      location: "San Francisco, CA",
      eligibility: "High school students with interest in AI and social impact",
      cost: "$1,800",
      financialAidAvailable: true,
      organizationName: "Tech for Change Foundation",
      contactEmail: "ai-camp@example.org",
      externalLink: "https://example.org/ai-social-good-camp",
      impactRating: 4,
      benefits: [
        "Develop AI skills with real-world applications",
        "Work on projects with social impact",
        "Connect with tech industry professionals",
        "Demonstrate leadership and initiative"
      ],
      isVerified: true
    },
    {
      title: "Global Youth Leadership Summit",
      description: "International gathering of young leaders to develop leadership skills and tackle global challenges.",
      category: "Leadership",
      tags: ["Leadership", "Global", "Networking"],
      programDates: "August 5 - August 12, 2025",
      applicationDeadline: new Date("2025-04-01"),
      location: "Geneva, Switzerland",
      eligibility: "High school students with leadership potential",
      cost: "$2,200 (includes accommodation)",
      financialAidAvailable: true,
      organizationName: "International Youth Foundation",
      contactEmail: "leadership-summit@example.org",
      externalLink: "https://example.org/youth-leadership-summit",
      impactRating: 5,
      benefits: [
        "Develop global leadership skills",
        "Network with peers from around the world",
        "Work on international challenges",
        "Enhance university applications with demonstrated leadership"
      ],
      isVerified: true
    },
    {
      title: "National Science Foundation Young Researchers Program",
      description: "Mentored research opportunity for high school students in STEM fields.",
      category: "Research",
      tags: ["STEM", "Research", "Mentorship"],
      programDates: "Year-round (10-week commitment)",
      applicationDeadline: new Date("2025-03-30"),
      location: "Multiple locations across the US",
      eligibility: "High school students with strong academic record in science and math",
      cost: "Free (includes stipend)",
      financialAidAvailable: true,
      organizationName: "National Science Foundation",
      contactEmail: "yrp@example.nsf.gov",
      externalLink: "https://example.nsf.gov/young-researchers",
      impactRating: 5,
      benefits: [
        "Conduct hands-on research with professional scientists",
        "Receive mentorship from experts in your field",
        "Potential for publication or conference presentations",
        "Highly regarded by selective universities"
      ],
      isVerified: true
    },
    {
      title: "Community Service Leadership Corps",
      description: "Year-long program combining community service with leadership development.",
      category: "Community Service",
      tags: ["Leadership", "Community Service", "Social Impact"],
      programDates: "September 2025 - May 2026",
      applicationDeadline: new Date("2025-05-15"),
      location: "Various locations (local chapters nationwide)",
      eligibility: "High school students committed to community service",
      cost: "Free",
      financialAidAvailable: false,
      organizationName: "National Community Service Alliance",
      contactEmail: "cslc@example.org",
      externalLink: "https://example.org/service-leadership-corps",
      impactRating: 4,
      benefits: [
        "Demonstrate commitment to community service",
        "Develop project management skills",
        "Lead community impact initiatives",
        "Show long-term dedication to social causes"
      ],
      isVerified: true
    },
    {
      title: "International Science Olympiad",
      description: "Prestigious international competition for young scientists.",
      category: "Competition",
      tags: ["Science", "International", "Competition"],
      programDates: "National preliminaries: January 2025, International finals: July 2025",
      applicationDeadline: new Date("2024-11-30"),
      location: "National rounds: Various, International finals: Tokyo, Japan",
      eligibility: "Top high school science students, selected through national competitions",
      cost: "Varies by country (sponsorship available for finalists)",
      financialAidAvailable: true,
      organizationName: "International Science Olympiad Committee",
      contactEmail: "iso@example.org",
      externalLink: "https://example.org/science-olympiad",
      impactRating: 5,
      benefits: [
        "Compete at the highest international level",
        "Gain recognition from top universities",
        "Earn medals and distinctions",
        "Join a network of exceptional science students"
      ],
      isVerified: true
    },
    {
      title: "Arts and Humanities Research Fellowship",
      description: "Research opportunity for students interested in arts, humanities, and social sciences.",
      category: "Research",
      tags: ["Humanities", "Arts", "Research"],
      programDates: "8-week program during summer 2025",
      applicationDeadline: new Date("2025-02-15"),
      location: "Chicago, IL",
      eligibility: "High school students with strong interest in humanities and arts",
      cost: "Free (includes stipend)",
      financialAidAvailable: true,
      organizationName: "National Humanities Center",
      contactEmail: "humanities-fellowship@example.org",
      externalLink: "https://example.org/humanities-fellowship",
      impactRating: 4,
      benefits: [
        "Conduct original research in humanities",
        "Work with scholars and experts",
        "Develop critical thinking and writing skills",
        "Appeal to liberal arts colleges and humanities programs"
      ],
      isVerified: true
    },
    {
      title: "Entrepreneurship Bootcamp for High School Innovators",
      description: "Intensive program teaching entrepreneurship and startup skills to young innovators.",
      category: "Entrepreneurship",
      tags: ["Business", "Innovation", "Startups"],
      programDates: "July 5 - July 25, 2025",
      applicationDeadline: new Date("2025-03-15"),
      location: "Boston, MA",
      eligibility: "High school students with entrepreneurial ideas or interests",
      cost: "$1,500",
      financialAidAvailable: true,
      organizationName: "Young Entrepreneurs Foundation",
      contactEmail: "bootcamp@example.org",
      externalLink: "https://example.org/entrepreneurship-bootcamp",
      impactRating: 4,
      benefits: [
        "Learn business and entrepreneurship fundamentals",
        "Develop and pitch original business ideas",
        "Network with entrepreneurs and investors",
        "Demonstrate innovation and business acumen"
      ],
      isVerified: true
    }
  ];

  // Insert opportunities into the database
  for (const opportunity of sampleOpportunities) {
    await db.insert(opportunities).values(opportunity);
  }

  console.log(`Successfully added ${sampleOpportunities.length} sample opportunities!`);
}

// Run the script
addSampleOpportunities()
  .then(() => {
    console.log("Script completed successfully.");
    process.exit(0);
  })
  .catch(error => {
    console.error("Error:", error);
    process.exit(1);
  });