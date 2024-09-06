import axios from 'axios';
import { config } from 'dotenv';

// Load environment variables from the `.env` file
config({ path: './env' });

// Define types more comprehensively
interface Article {
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

interface SummarizedArticle {
   title: string;
   url: string;
   summary: string;
}

// Extract API keys from environment variables
const NEWS_API_KEY = process.env.NEWS_API_KEY || '';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

/**
 * Fetches articles from the News API, filtering them based on keywords related to AI and LLM.
 */
async function fetchArticles(): Promise<Article[]> {
   try {
      const response = await axios.get(
         `https://newsapi.org/v2/everything?q=LLM+AI+"Large Language Models"&sortBy=popularity&apiKey=${NEWS_API_KEY}`
      );

      return response.data?.articles.filter((article: Article) =>
         /AI|LLM|Large Language Model|Artificial Intelligence/i.test(article.title)
      );
   } catch (error) {
      console.error('Error fetching news articles:', error);
      throw new Error('Failed to fetch articles.');
   }
}

/**
 * Summarizes a single article using GPT-4 API.
 */
async function summarizeArticle(article: Article): Promise<SummarizedArticle | null> {
   const prompt = `Summarize this news article: ${article.title}\n\n${article.description}`;

   try {
      const response = await axios.post(
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

      const summary = response.data.choices[0].message.content;
      return {
         title: article.title,
         url: article.url,
         summary,
      };
   } catch (error) {
      console.error(`Error summarizing article "${article.title}":`, error);
      return null; // Return null if the summarization fails
   }
}

/**
 * Summarizes a list of articles.
 */
async function summarizeArticles(articles: Article[]): Promise<SummarizedArticle[]> {
   const summaries = await Promise.all(articles.map(summarizeArticle));
   return summaries.filter((summary) => summary !== null) as SummarizedArticle[];
}

/**
 * Main function to fetch and summarize articles.
 */
async function main() {
   try {
      const articles = await fetchArticles();
      if (!articles || articles.length === 0) {
         console.log('No articles found related to AI or LLM.');
         return;
      }

      console.log(`Fetched ${articles.length} articles. Summarizing...`);

      const summarizedArticles = await summarizeArticles(articles);
      summarizedArticles.forEach((article) => {
         console.log(`\nTitle: ${article.title}\nURL: ${article.url}\nSummary: ${article.summary}`);
      });
   } catch (error) {
      console.error('Error in main function:', error);
   }
}

main();
