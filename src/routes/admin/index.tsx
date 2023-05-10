import { component$ } from "@builder.io/qwik";
import { Form, routeAction$, z, zod$ } from "@builder.io/qwik-city";
import prismaClient from "~/lib/prismaClient";

export const useCreateCategory = routeAction$(
  async (data) => {
    return prismaClient.category.create({ data });
  },
  zod$({
    name: z.string(),
  })
);

export default component$(() => {
  const createCategory = useCreateCategory();

  return (
    <div>
      <h1 class="test-3xl">Create Category</h1>
      <Form action={createCategory}>
        <label>Name</label>
        <input
          name="name"
          value={createCategory.formData?.get("name")}
          class="input input-bordered"
        />
        <button type="submit" class="btn">
          Create
        </button>
      </Form>
      {createCategory.value && (
        <div>
          <h2>Category created successfully!</h2>
        </div>
      )}
    </div>
  );
});
