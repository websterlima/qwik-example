import { component$, Slot, useStyles$ } from '@builder.io/qwik';
import { Link, routeLoader$, useLocation } from '@builder.io/qwik-city';
import Header from '~/components/starter/header/header';
import prismaClient from '~/lib/prismaClient';

import styles from './styles.css?inline';

export const useCategories = routeLoader$(async () => {
  return prismaClient.category.findMany();
})

const navItem = "p-2";
const navItemActive = `${navItem} bg-gray-300 text-black rounded-md font-bold`;

export default component$(() => {
  const categories = useCategories();

  useStyles$(styles);

  const location = useLocation();

  return (
    <>
      <Header />
      <main class="p-2">
        <div class="md:grid md:grid-cols-[20%_80%] gap-3">
          <div class="flex flex-col">
            <Link
              href="/"
              class={location.url.pathname === "/" ? navItemActive : navItem}
            >
              <div>Home</div>
            </Link>
            {categories.value?.map((category) => (
              <Link
                class={
                  location.url.pathname === `/categories/${category.id}/`
                    ? navItemActive
                    : navItem
                }
                href={`/categories/${category.id}`}
                key={category.id}
              >
                <div>{category.name}</div>
              </Link>
            ))}
          </div>
          <div>
            <Slot />
          </div>
        </div>
      </main>
    </>
  );
});
