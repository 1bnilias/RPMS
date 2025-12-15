import { FileText, TrendingUp, Award, Calendar, MapPin, Clock } from 'lucide-react'

export const newsItems = [
    {
        id: 1,
        category: 'Research',
        title: 'Breakthrough in AI-Driven Climate Modeling',
        summary: 'University researchers have developed a new model that predicts climate patterns with 40% higher accuracy.',
        content: `
      <p>Our university researchers have achieved a significant breakthrough in climate science by developing an AI-driven model that enhances the accuracy of climate pattern predictions by 40%. This innovative approach leverages deep learning algorithms to analyze vast datasets of historical climate data, enabling more precise forecasting of extreme weather events.</p>
      <p>The study, led by Dr. Sarah Chen from the Department of Environmental Science, has been published in the prestigious Nature Climate Change journal. "This model represents a leap forward in our ability to anticipate and prepare for climate change impacts," said Dr. Chen.</p>
      <p>The team plans to collaborate with international meteorological organizations to integrate this technology into global weather forecasting systems.</p>
    `,
        date: 'Dec 14, 2024',
        icon: TrendingUp,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100 dark:bg-blue-900/30'
    },
    {
        id: 2,
        category: 'Achievement',
        title: 'RPMS Journal Achieves Record Impact Factor',
        summary: 'Our flagship journal has been recognized as one of the top 10 publications in Computer Science this year.',
        content: `
      <p>We are thrilled to announce that the Research and Publication Management System (RPMS) Journal has achieved a record-breaking Impact Factor of 8.5 this year, placing it among the top 10 computer science publications globally.</p>
      <p>This recognition is a testament to the high-quality research submitted by our academic community and the rigorous peer-review process maintained by our editorial board. "We are committed to fostering excellence in research and providing a platform for impactful scientific discourse," stated Prof. Alan Turing, Editor-in-Chief.</p>
      <p>We thank all our authors, reviewers, and readers for their continued support and contribution to this success.</p>
    `,
        date: 'Dec 10, 2024',
        icon: Award,
        color: 'text-purple-600',
        bgColor: 'bg-purple-100 dark:bg-purple-900/30'
    },
    {
        id: 3,
        category: 'Policy',
        title: 'New Open Access Guidelines for 2025',
        summary: 'Updated guidelines for open access publishing will take effect from January 1st, 2025. Please review the changes.',
        content: `
      <p>Starting January 1st, 2025, the university will implement new Open Access Guidelines to ensure broader accessibility of research outputs. The key changes include:</p>
      <ul>
        <li>Mandatory open access for all publicly funded research.</li>
        <li>Introduction of a central fund to cover Article Processing Charges (APCs) for eligible journals.</li>
        <li>Requirement to deposit a version of the accepted manuscript in the institutional repository.</li>
      </ul>
      <p>These changes align with global initiatives to democratize access to knowledge and accelerate scientific progress. Faculty and students are encouraged to attend the upcoming information sessions to learn more.</p>
    `,
        date: 'Dec 05, 2024',
        icon: FileText,
        color: 'text-green-600',
        bgColor: 'bg-green-100 dark:bg-green-900/30'
    }
]

export const events = [
    {
        id: 1,
        title: 'Annual Research Symposium',
        date: 'Dec 20, 2024',
        time: '09:00 AM - 05:00 PM',
        location: 'Main Auditorium',
        type: 'Conference',
        description: `
      <p>Join us for the Annual Research Symposium, the university's premier event showcasing cutting-edge research from faculty and students across all disciplines. This year's theme is "Innovation for a Sustainable Future".</p>
      <p>The event will feature keynote speeches from renowned scholars, panel discussions, and poster presentations. It is an excellent opportunity to network with peers, exchange ideas, and explore potential collaborations.</p>
      <p>Registration is free for all university members. Lunch and refreshments will be provided.</p>
    `
    },
    {
        id: 2,
        title: 'Grant Writing Workshop',
        date: 'Jan 05, 2025',
        time: '02:00 PM - 04:00 PM',
        location: 'Virtual (Zoom)',
        type: 'Workshop',
        description: `
      <p>Are you looking to secure funding for your research? This hands-on workshop will guide you through the essential elements of writing a successful grant proposal.</p>
      <p>Led by experienced grant writers, the session will cover identifying funding sources, crafting a compelling narrative, and developing a budget. Participants will also have the chance to review successful grant applications.</p>
      <p>A Zoom link will be sent to registered participants one day before the event.</p>
    `
    },
    {
        id: 3,
        title: 'Thesis Defense: Computer Vision',
        date: 'Jan 12, 2025',
        time: '10:00 AM - 11:30 AM',
        location: 'Room 304, Science Block',
        type: 'Defense',
        description: `
      <p>You are cordially invited to attend the PhD thesis defense of John Doe, titled "Advanced Deep Learning Techniques for Real-Time Object Detection in Autonomous Vehicles".</p>
      <p>The defense will present novel algorithms that significantly improve the speed and accuracy of object detection systems, a critical component for the safety of self-driving cars.</p>
      <p>The presentation will be followed by a Q&A session with the examination committee and the audience.</p>
    `
    },
    {
        id: 4,
        title: 'Faculty Meet & Greet',
        date: 'Jan 15, 2025',
        time: '04:00 PM - 06:00 PM',
        location: 'Faculty Lounge',
        type: 'Social',
        description: `
      <p>New and returning faculty members are invited to a casual Meet & Greet event to kick off the new semester. Come and enjoy some light refreshments while connecting with colleagues from different departments.</p>
      <p>This is a great opportunity to build community, share experiences, and welcome new members to our academic family.</p>
    `
    }
]
