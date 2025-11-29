import { installerProcedure, router } from "@modules/trpc";
import { z } from "zod";
import { db, reconnectDatabase, schema } from "@modules/db";

const installerRouter = router({});

export default installerRouter;
