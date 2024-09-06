import axios from 'axios';
import { config } from 'dotenv';

interface singleArticleInt {
   source: {
      id: null | string;
      name: string;
   };
   author: string;
   title: string;
   description: string;
   url: string;
   urlToImage: string;
   publishedAt: string;
   content: string;
}

config({ path: './env' });

const NEWS_API_KEY = process.env.NEWS_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function fetchNewApi() {
   try {
      //Using axios to fetch from my news api
      const getResponse = await axios.get(
         `https://newsapi.org/v2/everything?q=LLM+AI+"Large Language Models"&sortBy=popularity&apiKey=${NEWS_API_KEY}`
      );

      //filtering down response to specific keywords "AI", "LLM"
      const newArticles =
         getResponse.data &&
         getResponse.data.articles.filter((item: singleArticleInt) => {
            return /AI|LLM|Large Language Model|Artificial Intelligence/i.test(item.title);
         });
      return newArticles;
   } catch (error) {
      console.log(error);
   }
}

// Function to summarize articles using GPT-4 API
async function summarizeArticles(articles: any[]) {
   const summaries = [];

   for (const article of articles) {
      const prompt = `Summarize this news article: ${article.title}\n\n${article.description}`;

      try {
         const gptResponse = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
               model: 'gpt-4o-mini',
               messages: [
                  { role: 'system', content: 'You are a helpful assistant.' },
                  { role: 'user', content: prompt },
               ],
            },
            {
               headers: {
                  Authorization: `Bearer ${OPENAI_API_KEY}`,
                  'Content-Type': 'application/json',
               },
            }
         );

         const summary = gptResponse.data.choices[0].message.content;
         summaries.push({
            title: article.title,
            url: article.url,
            summary,
         });

         //Logging it here so we don't have to wait for everything to finish before we view our result
         console.log(summaries);
      } catch (error) {
         console.error('Error summarizing article:', error);
      }
   }
   return summaries;
}

summarizeArticles(await fetchNewApi());
