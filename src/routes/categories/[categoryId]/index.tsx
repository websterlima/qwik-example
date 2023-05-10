import {
  $,
  component$,
  useComputed$,
  useSignal,
  useVisibleTask$,
} from "@builder.io/qwik";
import { routeLoader$, server$ } from "@builder.io/qwik-city";
import type { Question } from "@prisma/client";
import Answers from "~/components/starter/answers";
import prismaClient from "~/lib/prismaClient";
import { useAuthSession } from "~/routes/plugin@auth";
import type { VoteTally } from "~/types";

const vote = server$(
  async (email: string, questionId: number, answerId: number) => {
    await prismaClient.vote.deleteMany({
      where: { email, questionId },
    });

    await prismaClient.vote.create({
      data: {
        email,
        questionId,
        answerId,
      },
    });

    const question = await prismaClient.question.findFirst({
      where: { id: questionId },
    });

    const questions = await prismaClient.question.findMany({
      where: { categoryId: question?.categoryId ?? 0 },
      include: {
        answers: true,
      },
    });

    const votes = await getVotes(questions);

    return {
      votes,
      thankYou: "Thank you for voting!",
    };
  }
);

const getVotes = async (questions: Question[]): Promise<VoteTally[]> =>
  (
    await prismaClient.vote.groupBy({
      where: { questionId: { in: questions.map((q) => q.id) } },
      by: ["questionId", "answerId"],
      _count: {
        answerId: true,
      },
    })
  ).map(({ questionId, answerId, _count }) => ({
    questionId,
    answerId,
    count: _count?.answerId ?? 0,
  }));

export const useQuestions = routeLoader$(async ({ params, status }) => {
  const categoryId = parseInt(params["categoryId"], 10);
  const category = await prismaClient.category.findUnique({
    where: { id: categoryId },
  });

  if (!category) {
    status(404);
  }

  const questions = await prismaClient.question.findMany({
    where: { categoryId: categoryId },
    include: {
      answers: true,
    },
  });

  const votes = await getVotes(questions);

  return { questions, votes };
});

export default component$(() => {
  const session = useAuthSession();
  const questions = useQuestions();

  const response = useSignal<string | undefined>();
  const updatedVotes = useSignal<VoteTally[]>();

  useVisibleTask$(({ cleanup, track }) => {
    track(() => response.value);

    if (response.value) {
      const interval = setInterval(() => {
        response.value = undefined;
      }, 3000);

      cleanup(() => clearInterval(interval));
    }
  });

  const onVote = $(async (questionId: number, answerId: number) => {
    const voteResponse = await vote(
      session.value?.user?.email ?? "",
      questionId,
      answerId
    );

    response.value = voteResponse.thankYou;
    updatedVotes.value = voteResponse.votes;
  });

  const voteTallies = useComputed$(
    () => updatedVotes.value ?? questions.value?.votes ?? []
  );

  return (
    <>
      {response.value && (
        <div class="toast toast-top toast-end">
          <div class="alert alert-success">
            <div>
              <span>{response.value}</span>
            </div>
          </div>
        </div>
      )}
      {questions.value?.questions.map((question) => (
        <div key={question.id} class="mt-3 mb-6">
          <div class="text-2xl font-bold mb-3">{question.question}</div>
          <Answers
            question={question}
            answers={question.answers}
            voteTallies={voteTallies}
            loggedIn={!!session.value?.user}
            onVote$={onVote}
          />
        </div>
      ))}
    </>
  );
});
