import {
  extractRecipeFromHtmlFallback,
  extractRecipeFromJsonLd,
} from "@/lib/importers/jsonldRecipe";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function runTests() {
  const graphRecipe = {
    "@graph": [
      { "@type": "BreadcrumbList" },
      {
        "@type": ["Thing", "Recipe"],
        name: "Graph Recipe",
        image: ["https://example.com/graph.jpg"],
        recipeYield: "4 servings",
        totalTime: "PT1H30M",
        prepTime: "PT15M",
        cookTime: "PT1H15M",
        recipeIngredient: ["1 egg", "2 cups flour"],
        recipeInstructions: [
          { "@type": "HowToStep", text: "Mix ingredients." },
          { "@type": "HowToStep", text: "Bake." },
        ],
      },
    ],
  };

  const { recipe: graphParsed } = extractRecipeFromJsonLd([graphRecipe]);
  assert(Boolean(graphParsed), "Expected recipe from @graph JSON-LD.");
  assert(
    graphParsed?.title === "Graph Recipe",
    "Expected JSON-LD title to be parsed.",
  );
  assert(
    graphParsed?.instructions?.length === 2,
    "Expected two instruction steps.",
  );
  assert(
    graphParsed?.totalTimeMinutes === 90,
    "Expected total time to parse to minutes.",
  );

  const sectionRecipe = {
    "@type": "Recipe",
    name: "Section Recipe",
    recipeInstructions: [
      {
        "@type": "HowToSection",
        itemListElement: ["Step one", "Step two"],
      },
    ],
  };

  const { recipe: sectionParsed } = extractRecipeFromJsonLd([sectionRecipe]);
  assert(Boolean(sectionParsed), "Expected recipe from HowToSection JSON-LD.");
  assert(
    sectionParsed?.instructions?.length === 2,
    "Expected HowToSection itemListElement to parse.",
  );

  const htmlFallback = extractRecipeFromHtmlFallback(`
    <html>
      <head><title>Fallback Soup</title></head>
      <body>
        <h2>Ingredients</h2>
        <ul><li>1 cup water</li><li>2 carrots</li></ul>
        <h2>Instructions</h2>
        <ol><li>Boil water.</li><li>Add carrots.</li></ol>
      </body>
    </html>
  `);

  assert(
    htmlFallback.title === "Fallback Soup",
    "Expected fallback title to parse from HTML.",
  );
  assert(
    htmlFallback.ingredients?.length === 2,
    "Expected fallback ingredients list to parse.",
  );
  assert(
    htmlFallback.instructions?.length === 2,
    "Expected fallback instructions list to parse.",
  );
}

if (process.env.RUN_JSONLD_PARSER_TESTS) {
  runTests();
}
